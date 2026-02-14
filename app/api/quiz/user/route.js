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
    const status = searchParams.get('status'); // pending, in_progress, completed, all
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch user's quizzes
    let query = supabase
      .from('quizzes')
      .select(`
        id,
        topic_name,
        subject,
        status,
        current_level,
        easy_score,
        medium_score,
        hard_score,
        easy_unlocked,
        medium_unlocked,
        hard_unlocked,
        started_at,
        completed_at,
        created_at
      `)
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: quizzes, error: quizzesError } = await query;

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError);
      return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      total: quizzes.length,
      completed: quizzes.filter(q => q.status === 'completed').length,
      inProgress: quizzes.filter(q => q.status === 'in_progress').length,
      pending: quizzes.filter(q => q.status === 'pending').length,
      averageScore: 0
    };

    const completedQuizzes = quizzes.filter(q => q.status === 'completed');
    if (completedQuizzes.length > 0) {
      const totalScore = completedQuizzes.reduce((sum, q) =>
        sum + q.easy_score + q.medium_score + q.hard_score, 0
      );
      stats.averageScore = (totalScore / (completedQuizzes.length * 15) * 100).toFixed(1);
    }

    // Format quizzes for response
    const formattedQuizzes = quizzes.map(q => ({
      id: q.id,
      topicName: q.topic_name,
      subject: q.subject,
      status: q.status,
      currentLevel: q.current_level,
      scores: {
        easy: q.easy_score,
        medium: q.medium_score,
        hard: q.hard_score,
        total: q.easy_score + q.medium_score + q.hard_score
      },
      levelsUnlocked: {
        easy: q.easy_unlocked,
        medium: q.medium_unlocked,
        hard: q.hard_unlocked
      },
      startedAt: q.started_at,
      completedAt: q.completed_at,
      createdAt: q.created_at
    }));

    return NextResponse.json({
      success: true,
      quizzes: formattedQuizzes,
      stats
    });

  } catch (error) {
    console.error('User quizzes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
