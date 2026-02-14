-- Add qan_code to users table for curriculum grounding
ALTER TABLE users ADD COLUMN IF NOT EXISTS qan_code TEXT REFERENCES qualifications(qan_code);
CREATE INDEX IF NOT EXISTS idx_users_qan_code ON users (qan_code);
