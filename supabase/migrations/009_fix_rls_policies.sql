-- ============================================================================
-- Migration 009: Fix RLS Policies
-- Removes overly-permissive "Service read all" policies that defeated RLS,
-- and tightens messages policies to enforce subject enrollment checks.
-- ============================================================================

-- ── 1. Drop the USING(true) policies that bypass all security ────────
DROP POLICY IF EXISTS "Service read all subjects" ON subjects;
DROP POLICY IF EXISTS "Service read all messages" ON messages;
DROP POLICY IF EXISTS "Service read all enrollments" ON student_subjects;

-- ── 2. Drop old messages policies (too loose) ───────────────────────
DROP POLICY IF EXISTS "Users read own messages" ON messages;
DROP POLICY IF EXISTS "Users write own messages" ON messages;

-- ── 3. Tightened messages policies ──────────────────────────────────
-- SELECT: user owns the message AND is enrolled in that subject
CREATE POLICY "Users read own messages in enrolled subjects" ON messages
  FOR SELECT USING (
    user_id = auth.uid()
    AND subject_id IN (
      SELECT subject_id FROM student_subjects WHERE student_id = auth.uid()
    )
  );

-- INSERT: user can only write as themselves into subjects they're enrolled in
CREATE POLICY "Users write messages to enrolled subjects" ON messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND subject_id IN (
      SELECT subject_id FROM student_subjects WHERE student_id = auth.uid()
    )
  );

-- ── 4. Note on service_role ─────────────────────────────────────────
-- The service_role key used by supabaseAdmin in API routes automatically
-- bypasses RLS. No permissive policy is needed for it.
-- These RLS policies are defense-in-depth for any direct client access
-- via the publishable/anon key.
