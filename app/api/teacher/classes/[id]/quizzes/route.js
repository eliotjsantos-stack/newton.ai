import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(req, { params }) {
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

    const { id: classId } = await params;

    // Verify user is the teacher of this class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, teacher_id, name, subject')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (classData.teacher_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const studentId = searchParams.get('studentId');

    // Get all quizzes for this class
    let quizzesQuery = supabase
      .from('quizzes')
      .select(`
        id,
        user_id,
        topic_name,
        subject,
        status,
        easy_score,
        medium_score,
        hard_score,
        started_at,
        completed_at,
        created_at,
        users!inner(email, year_group)
      `)
      .eq('class_id', classId);

    if (startDate) {
      quizzesQuery = quizzesQuery.gte('created_at', startDate);
    }
    if (endDate) {
      quizzesQuery = quizzesQuery.lte('created_at', endDate);
    }
    if (studentId) {
      quizzesQuery = quizzesQuery.eq('user_id', studentId);
    }

    const { data: quizzes, error: quizzesError } = await quizzesQuery;

    if (quizzesError) {
      console.error('Error fetching quizzes:', quizzesError);
      return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
    }

    // Aggregate quiz data
    const completedQuizzes = (quizzes || []).filter(q => q.status === 'completed');
    const inProgressQuizzes = (quizzes || []).filter(q => q.status === 'in_progress');

    // Topic performance aggregation
    const topicPerformance = {};
    completedQuizzes.forEach(quiz => {
      if (!topicPerformance[quiz.topic_name]) {
        topicPerformance[quiz.topic_name] = {
          topic: quiz.topic_name,
          totalAttempts: 0,
          totalScore: 0,
          easyScore: 0,
          mediumScore: 0,
          hardScore: 0,
          students: new Set()
        };
      }
      const perf = topicPerformance[quiz.topic_name];
      perf.totalAttempts += 1;
      perf.totalScore += quiz.easy_score + quiz.medium_score + quiz.hard_score;
      perf.easyScore += quiz.easy_score;
      perf.mediumScore += quiz.medium_score;
      perf.hardScore += quiz.hard_score;
      perf.students.add(quiz.user_id);
    });

    const topicList = Object.values(topicPerformance).map(t => ({
      topic: t.topic,
      attempts: t.totalAttempts,
      studentCount: t.students.size,
      averageScore: t.totalAttempts > 0 ? ((t.totalScore / (t.totalAttempts * 15)) * 100).toFixed(1) : 0,
      averageEasy: t.totalAttempts > 0 ? ((t.easyScore / (t.totalAttempts * 5)) * 100).toFixed(1) : 0,
      averageMedium: t.totalAttempts > 0 ? ((t.mediumScore / (t.totalAttempts * 5)) * 100).toFixed(1) : 0,
      averageHard: t.totalAttempts > 0 ? ((t.hardScore / (t.totalAttempts * 5)) * 100).toFixed(1) : 0
    })).sort((a, b) => b.attempts - a.attempts);

    // Student performance aggregation
    const studentPerformance = {};
    completedQuizzes.forEach(quiz => {
      if (!studentPerformance[quiz.user_id]) {
        studentPerformance[quiz.user_id] = {
          userId: quiz.user_id,
          email: quiz.users?.email || 'Unknown',
          yearGroup: quiz.users?.year_group,
          quizzesCompleted: 0,
          totalScore: 0,
          topics: []
        };
      }
      const student = studentPerformance[quiz.user_id];
      student.quizzesCompleted += 1;
      student.totalScore += quiz.easy_score + quiz.medium_score + quiz.hard_score;
      student.topics.push({
        topic: quiz.topic_name,
        score: quiz.easy_score + quiz.medium_score + quiz.hard_score,
        completedAt: quiz.completed_at
      });
    });

    const studentList = Object.values(studentPerformance).map(s => ({
      ...s,
      averageScore: s.quizzesCompleted > 0 ? ((s.totalScore / (s.quizzesCompleted * 15)) * 100).toFixed(1) : 0
    })).sort((a, b) => b.quizzesCompleted - a.quizzesCompleted);

    // Identify struggling topics (average < 60%)
    const strugglingTopics = topicList.filter(t => parseFloat(t.averageScore) < 60);

    // Calculate overall stats
    const totalScore = completedQuizzes.reduce((sum, q) =>
      sum + q.easy_score + q.medium_score + q.hard_score, 0
    );
    const classAverageScore = completedQuizzes.length > 0
      ? ((totalScore / (completedQuizzes.length * 15)) * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      success: true,
      className: classData.name,
      subject: classData.subject,
      stats: {
        totalQuizzes: quizzes?.length || 0,
        completedQuizzes: completedQuizzes.length,
        inProgressQuizzes: inProgressQuizzes.length,
        studentsEngaged: new Set((quizzes || []).map(q => q.user_id)).size,
        classAverageScore
      },
      topicPerformance: topicList,
      studentPerformance: studentList,
      strugglingTopics,
      recentQuizzes: completedQuizzes
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .slice(0, 10)
        .map(q => ({
          id: q.id,
          visibleName: q.users?.email?.split('@')[0] || 'Unknown',
          studentEmail: q.users?.email || 'Unknown',
          topic: q.topic_name,
          score: q.easy_score + q.medium_score + q.hard_score,
          completedAt: q.completed_at
        })),
      inProgressQuizzes: inProgressQuizzes
        .sort((a, b) => new Date(b.started_at || b.created_at) - new Date(a.started_at || a.created_at))
        .slice(0, 10)
        .map(q => ({
          id: q.id,
          visibleName: q.users?.email?.split('@')[0] || 'Unknown',
          studentEmail: q.users?.email || 'Unknown',
          topic: q.topic_name,
          easyScore: q.easy_score,
          mediumScore: q.medium_score,
          hardScore: q.hard_score,
          startedAt: q.started_at,
          createdAt: q.created_at
        }))
    });

  } catch (error) {
    console.error('Teacher quizzes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
