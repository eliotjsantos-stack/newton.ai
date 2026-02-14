import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * GET /api/teacher/student-quiz-detail?studentId=X&topic=Y&classId=Z
 *
 * Returns a student's quiz history for a specific topic within a class's subject.
 */
export async function GET(req) {
  try {
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
    const studentId = searchParams.get('studentId');
    const topic = searchParams.get('topic');
    const classId = searchParams.get('classId');

    if (!studentId || !topic || !classId) {
      return NextResponse.json({ error: 'studentId, topic, and classId are required' }, { status: 400 });
    }

    // Verify teacher owns this class
    const { data: classData, error: classError } = await supabaseAdmin
      .from('classes')
      .select('id, teacher_id, subject')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (classData.teacher_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify student is in this class
    const { data: enrollment } = await supabaseAdmin
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .single();

    if (!enrollment) {
      return NextResponse.json({ error: 'Student not in this class' }, { status: 403 });
    }

    // Fetch quizzes for this student + topic + subject
    const { data: quizzes } = await supabaseAdmin
      .from('quizzes')
      .select('id, topic_name, status, created_at, total_marks, mode, questions, answers')
      .eq('user_id', studentId)
      .eq('topic_name', topic)
      .eq('subject', classData.subject)
      .order('created_at', { ascending: false });

    // Fetch mastery record for this student + topic
    const { data: mastery } = await supabaseAdmin
      .from('student_mastery')
      .select('mastery_level, status, last_quiz_at, last_activity_at')
      .eq('user_id', studentId)
      .eq('curriculum_topic', topic)
      .eq('subject', classData.subject)
      .single();

    return NextResponse.json({
      quizzes: quizzes || [],
      mastery: mastery || null,
    });
  } catch (err) {
    console.error('Student quiz detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
