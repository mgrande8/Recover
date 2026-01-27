import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendProUpgradeEmail } from '@/lib/email';
import { createProUpgradeNotification } from '@/lib/notifications';
import {
  getSubscriptionStatus,
  isSubscriptionActive,
  calculateExpirationDate,
  getPlanType,
  decodeSignedTransaction,
  APPLE_MONTHLY_PRODUCT_ID,
  APPLE_ANNUAL_PRODUCT_ID,
} from '@/lib/apple';

/**
 * Apple In-App Purchase Verification Endpoint
 *
 * Called by the iOS app after a successful purchase to:
 * 1. Verify the transaction with Apple
 * 2. Update the user's subscription status in the database
 * 3. Send welcome notifications
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      transactionId,
      originalTransactionId,
      productId,
      purchaseDate,
      expirationDate,
      environment,
    } = body;

    // Validate required fields
    if (!originalTransactionId || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields (originalTransactionId, productId)' },
        { status: 400 }
      );
    }

    // Validate product ID
    if (productId !== APPLE_MONTHLY_PRODUCT_ID && productId !== APPLE_ANNUAL_PRODUCT_ID) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Optional: Verify with Apple's Server API for additional security
    // This ensures the transaction is legitimate and not spoofed
    let verifiedExpirationDate = expirationDate;
    let isActive = true;

    // Try to verify with Apple's API (requires APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY)
    if (process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
      try {
        const subscriptionStatus = await getSubscriptionStatus(
          originalTransactionId,
          environment || 'Production'
        );

        if (subscriptionStatus?.data?.[0]?.lastTransactions?.[0]) {
          const latestTransaction = subscriptionStatus.data[0].lastTransactions[0];
          isActive = isSubscriptionActive(latestTransaction.status);

          // Decode the signed transaction for the latest expiration date
          const transactionInfo = decodeSignedTransaction(latestTransaction.signedTransactionInfo);
          if (transactionInfo?.expiresDate) {
            verifiedExpirationDate = new Date(transactionInfo.expiresDate).toISOString();
          }
        }
      } catch (apiError) {
        // Log but don't fail - trust the client data if API fails
        console.error('Apple API verification failed, using client data:', apiError);
      }
    }

    // Calculate expiration date if not provided
    if (!verifiedExpirationDate) {
      verifiedExpirationDate = calculateExpirationDate(productId).toISOString();
    }

    // Check if this transaction is already associated with another user
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('apple_original_transaction_id', originalTransactionId)
      .neq('id', user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'This subscription is already associated with another account' },
        { status: 409 }
      );
    }

    // Get current profile to check if this is a new subscription
    const { data: currentProfile } = await supabaseAdmin
      .from('profiles')
      .select('is_pro, apple_original_transaction_id')
      .eq('id', user.id)
      .single();

    const isNewSubscription = !currentProfile?.is_pro ||
      currentProfile?.apple_original_transaction_id !== originalTransactionId;

    // Update user profile with subscription info
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_pro: isActive,
        pro_expires_at: verifiedExpirationDate,
        apple_original_transaction_id: originalTransactionId,
        apple_product_id: productId,
        subscription_source: 'apple',
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update subscription status' },
        { status: 500 }
      );
    }

    // Send notifications for new subscriptions
    if (isNewSubscription && isActive) {
      const plan = getPlanType(productId);

      try {
        await createProUpgradeNotification(user.id, plan);
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }

      if (user.email) {
        try {
          await sendProUpgradeEmail(user.email, plan);
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      is_pro: isActive,
      pro_expires_at: verifiedExpirationDate,
      product_id: productId,
      plan: getPlanType(productId),
    });
  } catch (error) {
    console.error('Apple verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check current Apple subscription status
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_pro, pro_expires_at, apple_original_transaction_id, apple_product_id, subscription_source')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      is_pro: profile.is_pro,
      pro_expires_at: profile.pro_expires_at,
      subscription_source: profile.subscription_source,
      product_id: profile.apple_product_id,
      has_apple_subscription: !!profile.apple_original_transaction_id,
    });
  } catch (error) {
    console.error('Apple status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
