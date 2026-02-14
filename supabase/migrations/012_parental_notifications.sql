-- 012: Parental notification system
-- Adds parent contact fields to users and a notifications log table.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  notification_type VARCHAR(40) NOT NULL,
  subject_line VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
