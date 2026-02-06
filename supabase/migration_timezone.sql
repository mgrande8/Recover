-- Add timezone column to profiles table
-- Run this in Supabase SQL Editor

-- Add timezone column with default to America/New_York
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Update existing users to have a timezone if null
UPDATE profiles
SET timezone = 'America/New_York'
WHERE timezone IS NULL;
