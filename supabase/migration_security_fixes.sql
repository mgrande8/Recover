-- ============================================
-- RECOVER APP - SECURITY FIXES MIGRATION
-- ============================================
-- Run this in your Supabase SQL Editor to fix Security Advisor issues
-- Go to: https://app.supabase.com > Your Project > SQL Editor
-- ============================================

-- ============================================
-- FIX 1: Security Definer View on sleep_logs_with_stats
-- Change view to use SECURITY INVOKER (runs with caller's permissions)
-- ============================================
DROP VIEW IF EXISTS sleep_logs_with_stats;

CREATE VIEW sleep_logs_with_stats
WITH (security_invoker = true)
AS
SELECT
  sl.*,
  p.sleep_goal_hours,
  ROUND((sl.duration_minutes::DECIMAL / 60), 2) as duration_hours,
  ROUND((sl.duration_minutes::DECIMAL / (p.sleep_goal_hours * 60) * 100), 1) as goal_percentage
FROM sleep_logs sl
JOIN profiles p ON sl.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON sleep_logs_with_stats TO authenticated;

-- ============================================
-- FIX 2: Function search path mutable on update_updated_at_column
-- Add SET search_path = '' to prevent search_path injection attacks
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- FIX 3: Function search path mutable on handle_new_user
-- Add SET search_path = '' and explicitly qualify table references
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- ============================================
-- FIX 4: Function search path mutable on update_user_streak
-- Add SET search_path = '' and explicitly qualify table references
-- ============================================
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_streak_record public.user_streaks%ROWTYPE;
  v_yesterday DATE := (NEW.date - INTERVAL '1 day')::DATE;
  v_new_streak INTEGER;
BEGIN
  -- Get or create streak record for user
  SELECT * INTO v_streak_record
  FROM public.user_streaks
  WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_log_date, streak_started_at)
    VALUES (NEW.user_id, 1, 1, NEW.date, NEW.date);
    RETURN NEW;
  END IF;

  -- Calculate new streak
  IF v_streak_record.last_log_date = v_yesterday THEN
    -- Consecutive day - increment streak
    v_new_streak := v_streak_record.current_streak + 1;
  ELSIF v_streak_record.last_log_date = NEW.date THEN
    -- Same day - no change
    RETURN NEW;
  ELSIF v_streak_record.last_log_date < v_yesterday THEN
    -- Streak broken - reset to 1
    v_new_streak := 1;
    -- Update streak_started_at
    UPDATE public.user_streaks
    SET streak_started_at = NEW.date
    WHERE user_id = NEW.user_id;
  ELSE
    -- Future date somehow - just set to 1
    v_new_streak := 1;
  END IF;

  -- Update streak record
  UPDATE public.user_streaks
  SET
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_log_date = NEW.date,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- ============================================
-- FIX 5: RLS Policy Always True on notifications
-- Remove the overly permissive INSERT policy
-- The service role already bypasses RLS, so this policy is unnecessary
-- and creates a security hole allowing any authenticated user to insert
-- ============================================
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- Create a proper policy that only allows users to insert their own notifications
-- (if needed by client-side code) or rely on service role for backend inserts
CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SECURITY FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Fixed: Security Definer View on sleep_logs_with_stats';
  RAISE NOTICE 'Fixed: Function search path on update_updated_at_column';
  RAISE NOTICE 'Fixed: Function search path on handle_new_user';
  RAISE NOTICE 'Fixed: Function search path on update_user_streak';
  RAISE NOTICE 'Fixed: RLS Policy Always True on notifications';
  RAISE NOTICE '--------------------------------------------';
  RAISE NOTICE 'MANUAL ACTION REQUIRED:';
  RAISE NOTICE 'Enable "Leaked password protection" in Supabase Dashboard:';
  RAISE NOTICE '1. Go to Authentication > Settings';
  RAISE NOTICE '2. Under "Security" section, enable "Leaked password protection"';
  RAISE NOTICE '============================================';
END $$;
