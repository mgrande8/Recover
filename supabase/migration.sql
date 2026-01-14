-- ============================================
-- RECOVER APP - DATABASE MIGRATION
-- ============================================
-- Run this in your Supabase SQL Editor
-- Go to: https://app.supabase.com > Your Project > SQL Editor
-- ============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles
-- Stores user profile and preferences
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  user_type TEXT DEFAULT 'general' CHECK (user_type IN ('athlete', 'professional', 'parent', 'general')),
  goal TEXT DEFAULT 'energy' CHECK (goal IN ('energy', 'focus', 'performance', 'consistency')),
  typical_bedtime TIME DEFAULT '22:30',
  typical_wake_time TIME DEFAULT '06:30',
  sleep_goal_hours DECIMAL(3,1) DEFAULT 7.5 CHECK (sleep_goal_hours >= 4 AND sleep_goal_hours <= 12),
  is_pro BOOLEAN DEFAULT FALSE,
  pro_expires_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: sleep_logs
-- Stores nightly sleep data
-- ============================================
CREATE TABLE IF NOT EXISTS sleep_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  bedtime TIMESTAMPTZ NOT NULL,
  wake_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes < 1440),
  quality INTEGER CHECK (quality >= 1 AND quality <= 5),
  energy INTEGER CHECK (energy >= 1 AND energy <= 5),
  interruptions INTEGER DEFAULT 0 CHECK (interruptions >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One log per night per user
  UNIQUE(user_id, date)
);

-- ============================================
-- TABLE: checklist_logs
-- Stores pre-sleep checklist data
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  exercised BOOLEAN DEFAULT FALSE,
  no_caffeine_after_2pm BOOLEAN DEFAULT FALSE,
  no_alcohol BOOLEAN DEFAULT FALSE,
  no_heavy_meal BOOLEAN DEFAULT FALSE,
  room_dark BOOLEAN DEFAULT FALSE,
  room_cool BOOLEAN DEFAULT FALSE,
  screens_off_30min BOOLEAN DEFAULT FALSE,
  phone_not_in_bed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One checklist per day per user
  UNIQUE(user_id, date)
);

-- ============================================
-- INDEXES for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_date ON sleep_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_logs_user_date ON checklist_logs(user_id, date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Ensures users can only access their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Sleep logs policies
CREATE POLICY "Users can view own sleep logs"
  ON sleep_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sleep logs"
  ON sleep_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep logs"
  ON sleep_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sleep logs"
  ON sleep_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Checklist logs policies
CREATE POLICY "Users can view own checklist logs"
  ON checklist_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checklist logs"
  ON checklist_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklist logs"
  ON checklist_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checklist logs"
  ON checklist_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create a profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to auto-update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- HELPFUL VIEWS (Optional)
-- ============================================

-- View for recent sleep data with calculated fields
CREATE OR REPLACE VIEW sleep_logs_with_stats AS
SELECT
  sl.*,
  p.sleep_goal_hours,
  ROUND((sl.duration_minutes::DECIMAL / 60), 2) as duration_hours,
  ROUND((sl.duration_minutes::DECIMAL / (p.sleep_goal_hours * 60) * 100), 1) as goal_percentage
FROM sleep_logs sl
JOIN profiles p ON sl.user_id = p.id;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Recover database migration completed successfully!';
  RAISE NOTICE '📊 Tables created: profiles, sleep_logs, checklist_logs';
  RAISE NOTICE '🔐 Row Level Security enabled on all tables';
  RAISE NOTICE '⚡ Triggers created for auto-timestamps and user profile creation';
END $$;
