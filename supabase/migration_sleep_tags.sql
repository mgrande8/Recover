-- Sleep Log Tags Migration
-- Allows users to tag nights with life events for better self-awareness

-- Create sleep_log_tags table
CREATE TABLE IF NOT EXISTS sleep_log_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sleep_log_id UUID NOT NULL REFERENCES sleep_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag TEXT NOT NULL CHECK (tag IN ('travel', 'stress', 'sick', 'new_mattress', 'alcohol', 'exercise', 'medication', 'caffeine', 'screen_time', 'custom')),
  custom_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient lookups by sleep_log_id
CREATE INDEX idx_sleep_log_tags_sleep_log_id ON sleep_log_tags(sleep_log_id);
CREATE INDEX idx_sleep_log_tags_user_id ON sleep_log_tags(user_id);

-- Enable RLS
ALTER TABLE sleep_log_tags ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tags
CREATE POLICY "Users can view own tags"
  ON sleep_log_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON sleep_log_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON sleep_log_tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON sleep_log_tags FOR DELETE
  USING (auth.uid() = user_id);
