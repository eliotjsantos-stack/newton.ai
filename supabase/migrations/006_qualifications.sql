-- Migration: Qualifications Grounding Table
-- Source: DfE QAN_Current dataset (QWS SI Guide v1.04)
-- Filtered to GCSE (Level 2) and A-Level (Level 3) for AQA, OCR, Pearson

CREATE TABLE IF NOT EXISTS qualifications (
  qan_code    TEXT PRIMARY KEY,            -- 8-character QAN (column "QAN" in CSV)
  title       TEXT NOT NULL,               -- Full qualification title
  short_title TEXT,                         -- Short title for display
  board       TEXT NOT NULL                 -- Awarding body name: 'AQA', 'OCR', 'Pearson'
    CHECK (board IN ('AQA', 'OCR', 'Pearson')),
  level       SMALLINT NOT NULL            -- 2 = GCSE, 3 = A-Level
    CHECK (level IN (2, 3)),
  ab_code     SMALLINT NOT NULL,           -- Raw AB code from QAN dataset
  qual_type   TEXT,                         -- QualType code (e.g. GCSE, GCA, AA)
  disc_code   TEXT,                         -- Discount code / subject group
  ssft2_code  TEXT,                         -- Sector Subject Framework Tier 2
  ssft1_code  TEXT,                         -- Sector Subject Framework Tier 1
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups by board + level (the most common query pattern)
CREATE INDEX idx_qualifications_board_level ON qualifications (board, level);

-- Index for sector subject filtering
CREATE INDEX idx_qualifications_ssft2 ON qualifications (ssft2_code);

-- Curriculum objectives table (for Task 2 grounding engine)
CREATE TABLE IF NOT EXISTS curriculum_objectives (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qan_code    TEXT NOT NULL REFERENCES qualifications(qan_code) ON DELETE CASCADE,
  objective_text TEXT NOT NULL,
  topic_area  TEXT,                         -- Optional grouping (e.g. "Algebra", "Organic Chemistry")
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_curriculum_objectives_qan ON curriculum_objectives (qan_code);

-- Enable RLS
ALTER TABLE qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_objectives ENABLE ROW LEVEL SECURITY;

-- Read-only public access (these are public DfE data)
CREATE POLICY "Public read access" ON qualifications
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON curriculum_objectives
  FOR SELECT USING (true);
