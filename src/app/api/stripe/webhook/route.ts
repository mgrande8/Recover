import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const stripe = getStripe();
  const userId = session.subscription
    ? (await stripe.subscriptions.retrieve(session.subscription as string)).metadata.supabase_user_id
    : session.metadata?.supabase_user_id;

  if (!userId) {
    console.error('No user ID found in checkout session');
    return;
  }

  // Update user to Pro
  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({
      is_pro: true,
      stripe_subscription_id: session.subscription as string,
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update user to Pro:', error);
    throw error;
  }

  console.log(`User ${userId} upgraded to Pro`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.supabase_user_id;

  if (!userId) {
    console.error('No user ID found in subscription metadata');
    return;
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({
      is_pro: isActive,
      stripe_subscription_id: subscription.id,
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update subscription status:', error);
    throw error;
  }

  console.log(`User ${userId} subscription updated: ${subscription.status}`);
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

      console.log(`User ${profile.id} subscription cancelled`);
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

  console.log(`User ${userId} subscription cancelled`);
}
