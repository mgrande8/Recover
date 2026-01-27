-- ============================================
-- RECOVER APP - APPLE IN-APP PURCHASE MIGRATION
-- ============================================
-- Run this in your Supabase SQL Editor AFTER the Stripe migration
-- Adds Apple IAP-related columns for iOS subscription management
-- ============================================

-- Add Apple IAP columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS apple_product_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_source TEXT DEFAULT 'stripe';

-- Add comment to explain subscription_source values
COMMENT ON COLUMN profiles.subscription_source IS 'Source of subscription: stripe, apple, or null for no subscription';
COMMENT ON COLUMN profiles.apple_original_transaction_id IS 'Apple original transaction ID for subscription identification';
COMMENT ON COLUMN profiles.apple_product_id IS 'Apple product ID (e.g., com.mgrande8.recover.monthly)';

-- Create index for Apple transaction lookups
CREATE INDEX IF NOT EXISTS idx_profiles_apple_transaction ON profiles(apple_original_transaction_id);

-- Add constraint to ensure valid subscription_source values
-- (Only add if not exists - check first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_source_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_subscription_source_check
    CHECK (subscription_source IS NULL OR subscription_source IN ('stripe', 'apple'));
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Apple IAP migration completed successfully!';
  RAISE NOTICE '🍎 Added: apple_original_transaction_id, apple_product_id, subscription_source columns';
END $$;
