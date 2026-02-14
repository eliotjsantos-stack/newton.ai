-- Migration: Spaced repetition mastery system
-- Adds status tracking, retention checks, and refresher missions

-- Add spaced repetition columns to student_mastery
ALTER TABLE student_mastery
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'amber' CHECK (status IN ('red','amber','green')),
  ADD COLUMN IF NOT EXISTS last_quiz_score DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS last_quiz_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retention_check_due TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retention_check_passed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Add confidence rating to quiz_attempts
ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS confidence_rating INTEGER CHECK (confidence_rating >= 1 AND confidence_rating <= 5);

-- Refresher missions table — triggered by decay or failed retention checks
CREATE TABLE IF NOT EXISTS refresher_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mastery_id UUID NOT NULL REFERENCES student_mastery(id) ON DELETE CASCADE,
  trigger_reason VARCHAR(40) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','expired')),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresher_user ON refresher_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_refresher_status ON refresher_missions(status);
CREATE INDEX IF NOT EXISTS idx_refresher_due ON refresher_missions(due_at);
