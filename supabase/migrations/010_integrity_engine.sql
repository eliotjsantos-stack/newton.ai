-- Academic Integrity Engine
-- Tracks tab switches, paste attempts, and copy attempts during chat and quiz sessions

CREATE TABLE IF NOT EXISTS integrity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('chat','quiz')),
  session_id UUID,
  event_type VARCHAR(40) NOT NULL CHECK (event_type IN (
    'TAB_SWITCH','PASTE_BLOCKED','COPY_BLOCKED'
  )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrity_user ON integrity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_integrity_created ON integrity_logs(created_at DESC);
