-- ============================================
-- RECOVER APP - NOTIFICATIONS MIGRATION
-- ============================================
-- Run this in your Supabase SQL Editor
-- Go to: https://app.supabase.com > Your Project > SQL Editor
-- ============================================

-- ============================================
-- ADD NOTIFICATION PREFERENCES TO PROFILES
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_weekly_summary BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_streak_celebrations BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_reminders BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS reminder_time TIME DEFAULT '10:00';

-- ============================================
-- TABLE: notifications
-- Stores in-app notifications for users
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('streak', 'achievement', 'reminder', 'weekly_summary', 'pro_upgrade', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: user_streaks
-- Tracks user logging streaks
-- ============================================
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_log_date DATE,
  streak_started_at DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Allow service role to insert notifications (for backend/webhooks)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- User streaks policies
CREATE POLICY "Users can view own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Update streak on sleep log
-- ============================================
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_streak_record user_streaks%ROWTYPE;
  v_yesterday DATE := (NEW.date - INTERVAL '1 day')::DATE;
  v_new_streak INTEGER;
BEGIN
  -- Get or create streak record for user
  SELECT * INTO v_streak_record
  FROM user_streaks
  WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_log_date, streak_started_at)
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
    UPDATE user_streaks
    SET streak_started_at = NEW.date
    WHERE user_id = NEW.user_id;
  ELSE
    -- Future date somehow - just set to 1
    v_new_streak := 1;
  END IF;

  -- Update streak record
  UPDATE user_streaks
  SET
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_log_date = NEW.date,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Auto-update streak on sleep log
-- ============================================
DROP TRIGGER IF EXISTS on_sleep_log_update_streak ON sleep_logs;
CREATE TRIGGER on_sleep_log_update_streak
  AFTER INSERT ON sleep_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON user_streaks TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Notifications migration completed successfully!';
  RAISE NOTICE '📊 Tables created: notifications, user_streaks';
  RAISE NOTICE '⚙️ Profile columns added: email_weekly_summary, email_streak_celebrations, email_reminders, reminder_time';
  RAISE NOTICE '🔐 Row Level Security enabled';
  RAISE NOTICE '⚡ Streak auto-update trigger created';
END $$;
