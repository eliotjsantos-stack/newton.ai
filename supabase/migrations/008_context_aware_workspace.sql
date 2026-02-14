-- ============================================================================
-- Migration 008: Context-Aware Workspace
-- Upgrades Newton from single-user qan_code to per-subject grounding.
-- Creates: subjects, student_subjects, messages
-- Migrates: existing user.qan_code → default subject per user
-- ============================================================================

-- ── 1. Subjects table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  qan_code    TEXT REFERENCES qualifications(qan_code) ON DELETE SET NULL,
  teacher_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subjects_teacher ON subjects (teacher_id);
CREATE INDEX idx_subjects_qan ON subjects (qan_code);

-- ── 2. Student ↔ Subject enrollment junction ──────────────────────────
CREATE TABLE IF NOT EXISTS student_subjects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, subject_id)
);

CREATE INDEX idx_student_subjects_student ON student_subjects (student_id);
CREATE INDEX idx_student_subjects_subject ON student_subjects (subject_id);

-- ── 3. Messages table (replaces JSONB chat_data) ──────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_id     TEXT NOT NULL,              -- groups messages into conversations
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_subject_chat ON messages (subject_id, chat_id, created_at);
CREATE INDEX idx_messages_user ON messages (user_id);

-- ── 4. Add qan_code to classes table ──────────────────────────────────
ALTER TABLE classes ADD COLUMN IF NOT EXISTS qan_code TEXT REFERENCES qualifications(qan_code) ON DELETE SET NULL;

-- ── 5. Create a "General" subject (catch-all, no QAN) ─────────────────
-- This is a system-wide General subject. Every user gets enrolled.
INSERT INTO subjects (id, name, qan_code, teacher_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'General', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ── 6. Migrate existing users: enroll everyone in General ─────────────
INSERT INTO student_subjects (student_id, subject_id)
SELECT id, '00000000-0000-0000-0000-000000000001'
FROM users
WHERE account_type IS DISTINCT FROM 'teacher'
ON CONFLICT (student_id, subject_id) DO NOTHING;

-- ── 7. Migrate existing user.qan_code into personal subjects ──────────
-- For each user who had a qan_code set, create a subject and enroll them.
-- This preserves their grounding engine setup.
DO $$
DECLARE
  r RECORD;
  new_subject_id UUID;
BEGIN
  FOR r IN
    SELECT u.id AS user_id, u.qan_code, q.title, q.board
    FROM users u
    JOIN qualifications q ON q.qan_code = u.qan_code
    WHERE u.qan_code IS NOT NULL
  LOOP
    -- Create a subject for this qualification
    INSERT INTO subjects (name, qan_code, teacher_id)
    VALUES (r.title, r.qan_code, NULL)
    RETURNING id INTO new_subject_id;

    -- Enroll the user
    INSERT INTO student_subjects (student_id, subject_id)
    VALUES (r.user_id, new_subject_id)
    ON CONFLICT (student_id, subject_id) DO NOTHING;
  END LOOP;
END;
$$;

-- ── 8. RLS Policies ───────────────────────────────────────────────────

-- subjects: anyone can read subjects they're enrolled in, or the General subject
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read enrolled subjects" ON subjects
  FOR SELECT USING (
    id = '00000000-0000-0000-0000-000000000001'  -- General is always visible
    OR id IN (SELECT subject_id FROM student_subjects WHERE student_id = auth.uid())
    OR teacher_id = auth.uid()
  );

CREATE POLICY "Teachers can create subjects" ON subjects
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- student_subjects: users see only their own enrollments
ALTER TABLE student_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own enrollments" ON student_subjects
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Users can enroll themselves" ON student_subjects
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- messages: users can only read/write their own messages in enrolled subjects
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own messages in enrolled subjects" ON messages
  FOR SELECT USING (
    user_id = auth.uid()
    AND subject_id IN (
      SELECT subject_id FROM student_subjects WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Users write messages to enrolled subjects" ON messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND subject_id IN (
      SELECT subject_id FROM student_subjects WHERE student_id = auth.uid()
    )
  );

-- Note: service_role key (used by supabaseAdmin in API routes) automatically
-- bypasses RLS. No permissive USING(true) policies needed.
