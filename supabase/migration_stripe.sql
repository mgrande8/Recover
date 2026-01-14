-- ============================================
-- RECOVER APP - STRIPE MIGRATION
-- ============================================
-- Run this in your Supabase SQL Editor AFTER the initial migration
-- Adds Stripe-related columns for subscription management
-- ============================================

-- Add Stripe columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON profiles(stripe_subscription_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Stripe migration completed successfully!';
  RAISE NOTICE '💳 Added: stripe_customer_id, stripe_subscription_id columns';
END $$;
