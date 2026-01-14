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

// Price ID for the Pro subscription (set in Stripe dashboard)
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || '';

// Pro subscription price
export const PRO_PRICE = 4.99;
export const PRO_PRICE_DISPLAY = '$4.99/month';
