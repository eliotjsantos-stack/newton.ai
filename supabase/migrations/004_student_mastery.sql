-- Migration: Create student_mastery table for storing chat analysis results
-- This table stores LLM-extracted insights about student learning patterns

-- Create the student_mastery table
CREATE TABLE IF NOT EXISTS student_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID,  -- Optional reference to specific chat session
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,

    -- Topic information
    subject VARCHAR(100) NOT NULL,
    level VARCHAR(50),  -- e.g., 'Year 9', 'GCSE', 'A-Level'
    curriculum_topic VARCHAR(500) NOT NULL,  -- Full curriculum reference
    specific_topic VARCHAR(255),  -- Specific topic within the curriculum

    -- Learning insights
    blind_spots JSONB DEFAULT '[]'::jsonb,  -- Array of identified knowledge gaps
    recommended_focus JSONB DEFAULT '[]'::jsonb,  -- Array of recommended next steps
    summary TEXT,  -- One-sentence summary of understanding

    -- Scores
    confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),
    mastery_level INTEGER CHECK (mastery_level >= 1 AND mastery_level <= 5),

    -- Metadata
    message_count INTEGER DEFAULT 0,  -- Number of messages in the analyzed session
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for common queries
    CONSTRAINT valid_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 1 AND confidence_score <= 10)),
    CONSTRAINT valid_mastery CHECK (mastery_level IS NULL OR (mastery_level >= 1 AND mastery_level <= 5))
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_student_mastery_user_id ON student_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_student_mastery_class_id ON student_mastery(class_id);
CREATE INDEX IF NOT EXISTS idx_student_mastery_subject ON student_mastery(subject);
CREATE INDEX IF NOT EXISTS idx_student_mastery_analyzed_at ON student_mastery(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_mastery_user_subject ON student_mastery(user_id, subject);
CREATE INDEX IF NOT EXISTS idx_student_mastery_curriculum_topic ON student_mastery(curriculum_topic);

-- Create GIN index for JSONB blind_spots for efficient searching
CREATE INDEX IF NOT EXISTS idx_student_mastery_blind_spots ON student_mastery USING GIN (blind_spots);

-- Row Level Security (RLS)
ALTER TABLE student_mastery ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own mastery records
CREATE POLICY "Users can view own mastery"
    ON student_mastery
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own mastery records
CREATE POLICY "Users can insert own mastery"
    ON student_mastery
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Teachers can view mastery records for their class students
CREATE POLICY "Teachers can view class student mastery"
    ON student_mastery
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM classes c
            WHERE c.id = student_mastery.class_id
            AND c.teacher_id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON student_mastery TO authenticated;

-- Comments for documentation
COMMENT ON TABLE student_mastery IS 'Stores LLM-analyzed insights about student learning patterns from chat sessions';
COMMENT ON COLUMN student_mastery.curriculum_topic IS 'Full curriculum reference, e.g., "A-Level Pure Math: Calculus: Integration by Parts"';
COMMENT ON COLUMN student_mastery.blind_spots IS 'JSON array of identified knowledge gaps, e.g., ["forgets +C in integration", "confuses sin and cos"]';
COMMENT ON COLUMN student_mastery.confidence_score IS 'AI confidence in analysis (1-10), based on conversation length and clarity';
COMMENT ON COLUMN student_mastery.mastery_level IS 'Student mastery level (1-5): 1=No understanding, 5=Full mastery';
