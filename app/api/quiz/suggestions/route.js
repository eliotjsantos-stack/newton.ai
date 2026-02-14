import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * GET /api/quiz/suggestions
 *
 * Returns AI-derived "Topic Missions" for the quiz page.
 * Sources:
 *   1. student_mastery records (from chat analysis) — surfaces blind spots
 *   2. topics_discussed — surfaces recently chatted topics that lack a quiz
 *   3. Recent quizzes — avoids repeating what the student already aced
 */
export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch recent mastery records, topics discussed, and recent quizzes in parallel
    const [masteryRes, topicsRes, quizRes] = await Promise.all([
      supabase
        .from('student_mastery')
        .select('subject, specific_topic, blind_spots, mastery_level, recommended_focus, summary, analyzed_at')
        .eq('user_id', decoded.userId)
        .order('analyzed_at', { ascending: false })
        .limit(20),
      supabase
        .from('topics_discussed')
        .select('subject, topic, message_count, last_discussed_at')
        .eq('user_id', decoded.userId)
        .order('last_discussed_at', { ascending: false })
        .limit(20),
      supabase
        .from('quizzes')
        .select('topic_name, subject, status, correct_count, total_questions')
        .eq('user_id', decoded.userId)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    const mastery = masteryRes.data || [];
    const topics = topicsRes.data || [];
    const quizzes = quizRes.data || [];

    // Build a set of recently quizzed topics (completed with good scores) to de-prioritise
    const acedTopics = new Set();
    quizzes.forEach(q => {
      if (q.status === 'completed' && q.total_questions > 0) {
        const score = (q.correct_count || 0) / q.total_questions;
        if (score >= 0.8) acedTopics.add(`${q.subject}::${q.topic_name}`);
      }
    });

    const suggestions = [];
    const seen = new Set();

    // Source 1: Blind-spot missions from mastery analysis
    mastery.forEach(record => {
      if (!record.specific_topic || !record.subject) return;
      const key = `${record.subject}::${record.specific_topic}`;
      if (seen.has(key) || acedTopics.has(key)) return;
      seen.add(key);

      const hasBlindSpots = record.blind_spots && record.blind_spots.length > 0;
      const isWeak = (record.mastery_level || 3) <= 3;

      if (hasBlindSpots || isWeak) {
        suggestions.push({
          type: 'blind_spot',
          subject: record.subject,
          topic: record.specific_topic,
          label: hasBlindSpots
            ? `Strengthen: ${record.blind_spots[0]}`
            : `Practice: ${record.specific_topic}`,
          reason: record.summary || `Based on your recent chat about ${record.specific_topic}`,
          mastery: record.mastery_level || 3,
          priority: isWeak ? 10 : 5,
        });
      }
    });

    // Source 2: Recently discussed topics not yet quizzed
    topics.forEach(t => {
      if (!t.topic || !t.subject) return;
      const key = `${t.subject}::${t.topic}`;
      if (seen.has(key) || acedTopics.has(key)) return;
      seen.add(key);

      // Check if there's a quiz for this topic at all
      const hasQuiz = quizzes.some(
        q => q.subject === t.subject && q.topic_name === t.topic
      );

      if (!hasQuiz) {
        suggestions.push({
          type: 'chat_topic',
          subject: t.subject,
          topic: t.topic,
          label: `Quiz yourself: ${t.topic}`,
          reason: `You discussed this in chat — test your understanding`,
          mastery: null,
          priority: Math.min(t.message_count, 8),
        });
      }
    });

    // Sort by priority (highest first), limit to 5
    suggestions.sort((a, b) => b.priority - a.priority);

    return NextResponse.json({
      success: true,
      suggestions: suggestions.slice(0, 5),
    });
  } catch (error) {
    console.error('Quiz suggestions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
