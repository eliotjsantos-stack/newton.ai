import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(req) {
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

    const { assignmentId } = await req.json();

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    // Get the quiz assignment
    const { data: assignment, error: assignError } = await supabase
      .from('quiz_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (assignError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Verify student is enrolled in this class
    const { data: enrolment } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', decoded.userId)
      .eq('class_id', assignment.class_id)
      .single();

    if (!enrolment) {
      return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 403 });
    }

    // Check if student already started this assignment
    const { data: existing } = await supabase
      .from('quizzes')
      .select('id')
      .eq('user_id', decoded.userId)
      .eq('quiz_assignment_id', assignmentId)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, quizId: existing.id, alreadyStarted: true });
    }

    // Create quiz row from assignment template
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        user_id: decoded.userId,
        class_id: assignment.class_id,
        subject: assignment.subject,
        topic_name: assignment.topic_name,
        status: 'pending',
        current_level: 'easy',
        easy_score: 0,
        medium_score: 0,
        hard_score: 0,
        easy_unlocked: true,
        medium_unlocked: false,
        hard_unlocked: false,
        questions: assignment.questions,
        answers: [],
        quiz_assignment_id: assignmentId,
        total_marks: assignment.total_marks || 15,
        mode: assignment.mode || 'mini_quiz',
      })
      .select()
      .single();

    if (quizError) {
      console.error('Error creating quiz from assignment:', quizError);
      return NextResponse.json({ error: 'Failed to start quiz' }, { status: 500 });
    }

    return NextResponse.json({ success: true, quizId: quiz.id });
  } catch (error) {
    console.error('Start assigned quiz error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
