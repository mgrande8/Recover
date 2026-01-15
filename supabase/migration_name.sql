-- Migration: Add name column to profiles table
-- Run this migration after the main migration.sql

-- Add name column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name TEXT;

-- Create an index on name for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_name ON public.profiles(name);
