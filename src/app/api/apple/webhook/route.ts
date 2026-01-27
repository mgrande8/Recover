import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendProUpgradeEmail } from '@/lib/email';
import { createProUpgradeNotification } from '@/lib/notifications';
import {
  decodeServerNotification,
  decodeSignedTransaction,
  isSubscriptionActive,
  getPlanType,
  AppleNotificationType,
} from '@/lib/apple';

/**
 * Apple App Store Server Notifications V2 Webhook Handler
 *
 * This endpoint receives notifications from Apple about subscription events.
 * Configure this URL in App Store Connect under App Information > App Store Server Notifications
 * URL: https://recover-five.vercel.app/api/apple/webhook
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Apple sends the notification as a signed JWS payload
    const signedPayload = body.signedPayload;
    if (!signedPayload) {
      console.error('Missing signedPayload in Apple webhook');
      return NextResponse.json({ error: 'Missing signed payload' }, { status: 400 });
    }

    // Decode the notification
    const notification = decodeServerNotification(signedPayload);
    if (!notification) {
      console.error('Failed to decode Apple notification');
      return NextResponse.json({ error: 'Invalid notification format' }, { status: 400 });
    }

    console.log('Apple webhook received:', notification.notificationType, notification.subtype);

    // Decode the transaction info
    const transactionInfo = decodeSignedTransaction(notification.data.signedTransactionInfo);
    if (!transactionInfo) {
      console.error('Failed to decode transaction info');
      return NextResponse.json({ error: 'Invalid transaction info' }, { status: 400 });
    }

    // Handle the notification based on type
    await handleNotification(notification.notificationType, notification.subtype, transactionInfo);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Apple webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleNotification(
  type: AppleNotificationType,
  subtype: string | undefined,
  transactionInfo: {
    originalTransactionId: string;
    productId: string;
    expiresDate?: number;
    environment: string;
  }
) {
  const supabase = getSupabaseAdmin();

  // Find user by Apple transaction ID
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id, email, is_pro')
    .eq('apple_original_transaction_id', transactionInfo.originalTransactionId)
    .single();

  if (findError || !profile) {
    console.log('No profile found for transaction:', transactionInfo.originalTransactionId);
    // This is not necessarily an error - could be a notification for a transaction
    // that hasn't been verified yet via the /verify endpoint
    return;
  }

  switch (type) {
    case 'SUBSCRIBED': {
      // New subscription - activate Pro
      const expiresAt = transactionInfo.expiresDate
        ? new Date(transactionInfo.expiresDate).toISOString()
        : null;

      await supabase
        .from('profiles')
        .update({
          is_pro: true,
          pro_expires_at: expiresAt,
          apple_product_id: transactionInfo.productId,
          subscription_source: 'apple',
        })
        .eq('id', profile.id);

      // Send welcome email and notification only for initial purchase
      if (subtype === 'INITIAL_BUY') {
        const plan = getPlanType(transactionInfo.productId);
        try {
          await createProUpgradeNotification(profile.id, plan);
          if (profile.email) {
            await sendProUpgradeEmail(profile.email, plan);
          }
        } catch (e) {
          console.error('Failed to send notifications:', e);
        }
      }
      break;
    }

    case 'DID_RENEW': {
      // Subscription renewed successfully
      const expiresAt = transactionInfo.expiresDate
        ? new Date(transactionInfo.expiresDate).toISOString()
        : null;

      await supabase
        .from('profiles')
        .update({
          is_pro: true,
          pro_expires_at: expiresAt,
        })
        .eq('id', profile.id);

      console.log('Subscription renewed for user:', profile.id);
      break;
    }

    case 'EXPIRED': {
      // Subscription expired - deactivate Pro
      await supabase
        .from('profiles')
        .update({
          is_pro: false,
        })
        .eq('id', profile.id);

      console.log('Subscription expired for user:', profile.id);
      break;
    }

    case 'DID_FAIL_TO_RENEW': {
      // Payment failed - handle based on subtype
      if (subtype === 'GRACE_PERIOD') {
        // Still in grace period - keep Pro active
        console.log('Subscription in grace period for user:', profile.id);
      } else {
        // Billing retry failed
        console.log('Subscription billing retry for user:', profile.id);
      }
      break;
    }

    case 'GRACE_PERIOD_EXPIRED': {
      // Grace period ended without successful payment - deactivate Pro
      await supabase
        .from('profiles')
        .update({
          is_pro: false,
        })
        .eq('id', profile.id);

      console.log('Grace period expired for user:', profile.id);
      break;
    }

    case 'DID_CHANGE_RENEWAL_STATUS': {
      // User toggled auto-renew (doesn't affect current subscription)
      if (subtype === 'AUTO_RENEW_DISABLED') {
        console.log('Auto-renew disabled for user:', profile.id);
      } else if (subtype === 'AUTO_RENEW_ENABLED') {
        console.log('Auto-renew re-enabled for user:', profile.id);
      }
      break;
    }

    case 'DID_CHANGE_RENEWAL_PREF': {
      // User changed from monthly to annual or vice versa
      await supabase
        .from('profiles')
        .update({
          apple_product_id: transactionInfo.productId,
        })
        .eq('id', profile.id);

      console.log('Subscription plan changed for user:', profile.id);
      break;
    }

    case 'REFUND': {
      // Refund processed - deactivate Pro immediately
      await supabase
        .from('profiles')
        .update({
          is_pro: false,
          apple_original_transaction_id: null,
          apple_product_id: null,
        })
        .eq('id', profile.id);

      console.log('Refund processed for user:', profile.id);
      break;
    }

    case 'REVOKE': {
      // Subscription revoked (e.g., family sharing removed)
      await supabase
        .from('profiles')
        .update({
          is_pro: false,
          apple_original_transaction_id: null,
          apple_product_id: null,
        })
        .eq('id', profile.id);

      console.log('Subscription revoked for user:', profile.id);
      break;
    }

    case 'TEST': {
      // Test notification from App Store Connect
      console.log('Apple test notification received');
      break;
    }

    default:
      console.log('Unhandled Apple notification type:', type);
  }
}
