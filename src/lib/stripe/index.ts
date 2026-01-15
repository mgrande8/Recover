import Stripe from 'stripe';

// Lazy-initialize Stripe to avoid build-time errors when env vars aren't available
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Price IDs for Pro subscriptions (set in Stripe dashboard)
export const PRO_MONTHLY_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || '';
export const PRO_ANNUAL_PRICE_ID = process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '';

// Pro subscription prices
export const PRO_MONTHLY_PRICE = 4.99;
export const PRO_ANNUAL_PRICE = 39.99;
export const PRO_ANNUAL_MONTHLY_EQUIVALENT = 3.33; // $39.99 / 12 months
