import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe, PRO_ANNUAL_PRICE_ID } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendProUpgradeEmail } from '@/lib/email';
import { createProUpgradeNotification, createProExpiredNotification } from '@/lib/notifications';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        // Silently ignore unhandled event types
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();

  // Get subscription details
  let subscription: Stripe.Subscription | null = null;
  let userId: string | undefined;

  if (session.subscription) {
    subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    userId = subscription.metadata.supabase_user_id;
  } else {
    userId = session.metadata?.supabase_user_id;
  }

  if (!userId) {
    console.error('No user ID found in checkout session');
    return;
  }

  // Determine expiration date based on plan type
  let proExpiresAt: string;

  // Check if it's annual plan
  if (subscription?.items?.data?.[0]?.price?.id === PRO_ANNUAL_PRICE_ID) {
    // Annual: 1 year from now
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    proExpiresAt = expiry.toISOString();
  } else {
    // Monthly: 1 month from now
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    proExpiresAt = expiry.toISOString();
  }

  // Update user to Pro
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      is_pro: true,
      pro_expires_at: proExpiresAt,
      stripe_subscription_id: session.subscription as string,
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update user to Pro:', error);
    throw error;
  }

  // Determine plan type (monthly or annual)
  let plan: 'monthly' | 'annual' = 'monthly';
  if (subscription?.items?.data?.[0]?.price?.id === PRO_ANNUAL_PRICE_ID) {
    plan = 'annual';
  }

  // Create in-app notification
  try {
    await createProUpgradeNotification(userId, plan);
  } catch (notificationError) {
    console.error('Failed to create Pro upgrade notification:', notificationError);
  }

  // Get user email and send congratulations email
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (userData?.user?.email) {
    try {
      await sendProUpgradeEmail(userData.user.email, plan);
    } catch (emailError) {
      // Don't fail the webhook if email fails
      console.error('Failed to send Pro upgrade email:', emailError);
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.supabase_user_id;

  if (!userId) {
    console.error('No user ID found in subscription metadata');
    return;
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  // Calculate expiration date from Stripe's current_period_end
  let proExpiresAt: string | null = null;
  const periodEnd = (subscription as any).current_period_end;
  if (isActive && periodEnd) {
    proExpiresAt = new Date(periodEnd * 1000).toISOString();
  }

  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({
      is_pro: isActive,
      pro_expires_at: proExpiresAt,
      stripe_subscription_id: subscription.id,
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update subscription status:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.supabase_user_id;

  if (!userId) {
    // Try to find user by subscription ID
    const { data: profile } = await getSupabaseAdmin()
      .from('profiles')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (profile) {
      await getSupabaseAdmin()
        .from('profiles')
        .update({
          is_pro: false,
          stripe_subscription_id: null,
        })
        .eq('id', profile.id);

      try {
        await createProExpiredNotification(profile.id);
      } catch (e) {
        console.error('Failed to send Pro expired notification:', e);
      }
    }
    return;
  }

  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({
      is_pro: false,
      stripe_subscription_id: null,
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to cancel subscription:', error);
    throw error;
  }

  try {
    await createProExpiredNotification(userId);
  } catch (e) {
    console.error('Failed to send Pro expired notification:', e);
  }
}
