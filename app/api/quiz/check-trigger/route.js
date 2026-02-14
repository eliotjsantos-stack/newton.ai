import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(req) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');
    const topicName = searchParams.get('topicName');
    const messageCount = parseInt(searchParams.get('messageCount') || '0');

    // Quiz trigger threshold: show notification at 12-15 messages
    const QUIZ_THRESHOLD = 12;

    if (messageCount < QUIZ_THRESHOLD) {
      return NextResponse.json({
        shouldShowQuiz: false,
        reason: 'Not enough messages yet'
      });
    }

    // Check if user already has a pending or in-progress quiz for this topic
    let existingQuizQuery = supabase
      .from('quizzes')
      .select('id, status, topic_name')
      .eq('user_id', decoded.userId)
      .in('status', ['pending', 'in_progress']);

    if (topicId) {
      existingQuizQuery = existingQuizQuery.eq('topic_id', topicId);
    } else if (topicName) {
      existingQuizQuery = existingQuizQuery.eq('topic_name', topicName);
    }

    const { data: existingQuiz } = await existingQuizQuery.single();

    if (existingQuiz) {
      return NextResponse.json({
        shouldShowQuiz: true,
        existingQuiz: {
          id: existingQuiz.id,
          status: existingQuiz.status,
          topicName: existingQuiz.topic_name
        },
        message: 'You have an existing quiz for this topic'
      });
    }

    // Check if user completed a quiz on this topic recently (within 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    let recentQuizQuery = supabase
      .from('quizzes')
      .select('id, completed_at')
      .eq('user_id', decoded.userId)
      .eq('status', 'completed')
      .gte('completed_at', oneDayAgo);

    if (topicId) {
      recentQuizQuery = recentQuizQuery.eq('topic_id', topicId);
    } else if (topicName) {
      recentQuizQuery = recentQuizQuery.eq('topic_name', topicName);
    }

    const { data: recentQuiz } = await recentQuizQuery.single();

    if (recentQuiz) {
      return NextResponse.json({
        shouldShowQuiz: false,
        reason: 'Quiz completed recently',
        nextAvailable: new Date(new Date(recentQuiz.completed_at).getTime() + 24 * 60 * 60 * 1000)
      });
    }

    // All checks passed - show quiz notification
    return NextResponse.json({
      shouldShowQuiz: true,
      message: 'Ready to test your understanding?'
    });

  } catch (error) {
    console.error('Quiz trigger check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
