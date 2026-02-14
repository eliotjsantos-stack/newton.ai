-- Topic Intelligence & Smart Quizzes Schema
-- Run this in Supabase SQL Editor

-- 1. Topics Discussed Table
-- Tracks what topics each student has discussed with Newton
CREATE TABLE IF NOT EXISTS topics_discussed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  subtopic VARCHAR(255),
  message_count INTEGER DEFAULT 1,
  first_discussed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_discussed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conversation_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one record per user/class/topic combination
  CONSTRAINT unique_user_class_topic UNIQUE(user_id, class_id, topic)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_topics_user ON topics_discussed(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_class ON topics_discussed(class_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics_discussed(subject);
CREATE INDEX IF NOT EXISTS idx_topics_last_discussed ON topics_discussed(last_discussed_at);
CREATE INDEX IF NOT EXISTS idx_topics_topic_name ON topics_discussed(topic);

-- 2. Understanding Ratings Table
-- Stores student self-assessment ratings for topics
CREATE TABLE IF NOT EXISTS understanding_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics_discussed(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  unclear_feedback TEXT,
  message_count_at_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ratings_user ON understanding_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_topic ON understanding_ratings(topic_id);
CREATE INDEX IF NOT EXISTS idx_ratings_class ON understanding_ratings(class_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON understanding_ratings(created_at);

-- 3. Quizzes Table
-- Stores quiz instances with questions and results
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics_discussed(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  subject VARCHAR(100) NOT NULL,
  topic_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'abandoned')),
  current_level VARCHAR(10) DEFAULT 'easy' CHECK (current_level IN ('easy', 'medium', 'hard')),
  current_question INTEGER DEFAULT 0,
  easy_score INTEGER DEFAULT 0,
  medium_score INTEGER DEFAULT 0,
  hard_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  easy_unlocked BOOLEAN DEFAULT TRUE,
  medium_unlocked BOOLEAN DEFAULT FALSE,
  hard_unlocked BOOLEAN DEFAULT FALSE,
  questions JSONB NOT NULL DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  chat_context JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic ON quizzes(topic_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_class ON quizzes(class_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_created ON quizzes(created_at);

-- 4. Quiz Attempts Table
-- Detailed record of each answer attempt for analytics
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('easy', 'medium', 'hard')),
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'explain')),
  question_text TEXT NOT NULL,
  student_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  ai_feedback TEXT,
  time_taken_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_level ON quiz_attempts(level);
CREATE INDEX IF NOT EXISTS idx_attempts_correct ON quiz_attempts(is_correct);

-- Note: This app uses custom JWT auth with service role key
-- RLS is not needed since all API routes verify JWT and use service role
-- If you want to enable RLS later, add policies based on your auth setup
