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

    // Get enrolled class IDs
    const { data: enrolments, error: enrolError } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', decoded.userId);

    if (enrolError) {
      return NextResponse.json({ error: 'Failed to load enrolments' }, { status: 500 });
    }

    const classIds = (enrolments || []).map(e => e.class_id);

    if (classIds.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    // Get class info
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name, subject')
      .in('id', classIds);

    const classMap = {};
    for (const c of (classes || [])) {
      classMap[c.id] = c;
    }

    // Fetch regular class assignments
    const { data: taskAssignments } = await supabase
      .from('class_assignments')
      .select('id, class_id, title, description, due_date, created_at')
      .in('class_id', classIds);

    // Fetch quiz assignments
    const { data: quizAssignments } = await supabase
      .from('quiz_assignments')
      .select('id, class_id, subject, topic_name, due_date, created_at')
      .in('class_id', classIds)
      .eq('status', 'published');

    // Check student's quiz completion status
    const quizAssignmentIds = (quizAssignments || []).map(a => a.id);
    let quizMap = {};
    if (quizAssignmentIds.length > 0) {
      const { data: studentQuizzes } = await supabase
        .from('quizzes')
        .select('quiz_assignment_id, status')
        .eq('user_id', decoded.userId)
        .in('quiz_assignment_id', quizAssignmentIds);

      for (const q of (studentQuizzes || [])) {
        quizMap[q.quiz_assignment_id] = q.status;
      }
    }

    // Merge into single list
    const merged = [];

    for (const a of (taskAssignments || [])) {
      merged.push({
        id: a.id,
        type: 'task',
        title: a.title,
        description: a.description || null,
        subject: classMap[a.class_id]?.subject || '',
        className: classMap[a.class_id]?.name || '',
        classId: a.class_id,
        dueDate: a.due_date,
        createdAt: a.created_at,
        completed: false,
      });
    }

    for (const a of (quizAssignments || [])) {
      merged.push({
        id: a.id,
        type: 'quiz',
        title: a.topic_name,
        description: null,
        subject: a.subject,
        className: classMap[a.class_id]?.name || '',
        classId: a.class_id,
        dueDate: a.due_date,
        createdAt: a.created_at,
        completed: quizMap[a.id] === 'completed',
      });
    }

    // Sort by due_date ASC (nulls last)
    merged.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    return NextResponse.json({ assignments: merged });
  } catch (error) {
    console.error('All assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
