-- Add has_rated_app column to profiles table
-- Run this in Supabase SQL Editor

-- Add has_rated_app column with default false
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_rated_app BOOLEAN DEFAULT FALSE;

-- Update existing users to have false if null
UPDATE profiles
SET has_rated_app = FALSE
WHERE has_rated_app IS NULL;
