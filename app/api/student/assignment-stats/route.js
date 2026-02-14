import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

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

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    // Get the assignment to find its topic and class
    const { data: assignment, error: assignmentErr } = await supabaseAdmin
      .from('assignments')
      .select('id, topic, class_id')
      .eq('id', assignmentId)
      .single();

    if (assignmentErr || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Get quiz attempts for the same topic within the same class
    const { data: attempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('score, total_questions, user_id')
      .eq('topic', assignment.topic)
      .eq('class_id', assignment.class_id);

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({
        avgScore: 0,
        completionRate: 0,
        difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
      });
    }

    // Calculate average score percentage
    const scores = attempts.map(a => (a.total_questions > 0 ? (a.score / a.total_questions) * 100 : 0));
    const avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

    // Get class member count for completion rate
    const { count: classSize } = await supabaseAdmin
      .from('class_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', assignment.class_id);

    const uniqueStudents = new Set(attempts.map(a => a.user_id)).size;
    const completionRate = classSize > 0 ? Math.round((uniqueStudents / classSize) * 100) : 0;

    // Difficulty distribution based on score ranges
    const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
    scores.forEach(s => {
      if (s >= 70) difficultyDistribution.easy++;
      else if (s >= 40) difficultyDistribution.medium++;
      else difficultyDistribution.hard++;
    });

    return NextResponse.json({
      avgScore,
      completionRate,
      difficultyDistribution,
    });
  } catch (err) {
    console.error('Assignment stats error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
