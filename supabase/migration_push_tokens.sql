-- ============================================
-- RECOVER APP - PUSH NOTIFICATIONS MIGRATION
-- ============================================
-- Run this in your Supabase SQL Editor
-- This adds support for storing device push tokens
-- ============================================

-- ============================================
-- TABLE: device_tokens
-- Stores push notification tokens for devices
-- ============================================
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One token per device per user
  UNIQUE(user_id, token)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens
CREATE POLICY "Users can view own device tokens"
  ON device_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own device tokens"
  ON device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own device tokens"
  ON device_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own device tokens"
  ON device_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ADD PUSH ENABLED PREFERENCE TO PROFILES
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT TRUE;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON device_tokens TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Push Notifications Migration Complete!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Created: device_tokens table';
  RAISE NOTICE 'Added: push_notifications_enabled to profiles';
  RAISE NOTICE '============================================';
END $$;
