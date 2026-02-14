import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

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

    // Optional classId filter
    const { searchParams } = new URL(req.url);
    const classIdFilter = searchParams.get('classId');

    // Get enrolled class IDs
    const { data: enrolments, error: enrolError } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', decoded.userId);

    if (enrolError) {
      return NextResponse.json({ error: 'Failed to load enrolments' }, { status: 500 });
    }

    let classIds = (enrolments || []).map(e => e.class_id);
    if (classIdFilter) {
      classIds = classIds.filter(id => id === classIdFilter);
    }

    if (classIds.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    // Get published quiz assignments for enrolled classes
    const { data: assignments, error: assignError } = await supabase
      .from('quiz_assignments')
      .select('id, class_id, subject, topic_name, due_date, status, created_at')
      .in('class_id', classIds)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (assignError) {
      return NextResponse.json({ error: 'Failed to load quiz assignments' }, { status: 500 });
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    // Get class names for context
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name, subject')
      .in('id', classIds);

    const classMap = {};
    for (const c of (classes || [])) {
      classMap[c.id] = c;
    }

    // Check which assignments the student has already started
    const assignmentIds = assignments.map(a => a.id);
    const { data: studentQuizzes } = await supabase
      .from('quizzes')
      .select('id, quiz_assignment_id, status')
      .eq('user_id', decoded.userId)
      .in('quiz_assignment_id', assignmentIds);

    const quizMap = {};
    for (const q of (studentQuizzes || [])) {
      quizMap[q.quiz_assignment_id] = { quizId: q.id, status: q.status };
    }

    const enriched = assignments.map(a => ({
      id: a.id,
      classId: a.class_id,
      className: classMap[a.class_id]?.name || '',
      subject: a.subject,
      topicName: a.topic_name,
      dueDate: a.due_date,
      createdAt: a.created_at,
      started: !!quizMap[a.id],
      completed: quizMap[a.id]?.status === 'completed',
      quizId: quizMap[a.id]?.quizId || null,
    }));

    return NextResponse.json({ assignments: enriched });
  } catch (error) {
    console.error('Student quiz assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
