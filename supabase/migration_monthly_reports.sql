-- Monthly Reports Migration
-- Stores computed 30-day sleep reports for Pro users

CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  stats JSONB NOT NULL,
  comparison JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- Index for efficient lookups
CREATE INDEX idx_monthly_reports_user_id ON monthly_reports(user_id);

-- Enable RLS
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reports
CREATE POLICY "Users can view own reports"
  ON monthly_reports FOR SELECT
  USING (auth.uid() = user_id);
