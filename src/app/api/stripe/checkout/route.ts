import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, PRO_MONTHLY_PRICE_ID, PRO_ANNUAL_PRICE_ID } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    // Get the plan type from request body
    const body = await request.json().catch(() => ({}));
    const plan = body.plan || 'monthly'; // 'monthly' or 'annual'

    const priceId = plan === 'annual' ? PRO_ANNUAL_PRICE_ID : PRO_MONTHLY_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured' },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile to check for existing Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    const stripe = getStripe();

    // Create a Stripe customer if one doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save the Stripe customer ID to the profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/settings?upgraded=true`,
      cancel_url: `${origin}/dashboard/upgrade`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
