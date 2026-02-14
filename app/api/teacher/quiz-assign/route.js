import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { randomizeQuizNumbers } from '@/lib/quizRandomizer';
import { getQuizGrounding, buildQuizPrompt } from '@/lib/quizGrounding';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function authenticateTeacher(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, account_type, is_admin')
      .eq('id', decoded.userId)
      .single();

    if (error) return null;
    if (!user || (!user.is_admin && user.account_type !== 'teacher')) return null;
    return user;
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const user = await authenticateTeacher(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { classId, topicName, dueDate, totalMarks, mode } = await req.json();

    if (!classId || !topicName) {
      return NextResponse.json({ error: 'classId and topicName are required' }, { status: 400 });
    }

    // Verify teacher owns this class
    const { data: cls, error: classError } = await supabaseAdmin
      .from('classes')
      .select('id, subject, year_group, teacher_id')
      .eq('id', classId)
      .single();

    if (classError || !cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (cls.teacher_id !== user.id && !user.is_admin) {
      return NextResponse.json({ error: 'Not your class' }, { status: 403 });
    }

    // Validate mode and totalMarks
    const validModes = ['mini_quiz', 'full_test', 'topic_focus', 'past_paper'];
    const effectiveMode = validModes.includes(mode) ? mode : 'mini_quiz';
    const effectiveTotalMarks = totalMarks && totalMarks >= 5 && totalMarks <= 100
      ? Math.round(totalMarks / 5) * 5
      : null;

    // Get grounding data from class qualification
    const grounding = await getQuizGrounding(classId);

    // Build prompt using shared helper
    const { prompt, effectiveMarks } = buildQuizPrompt({
      topicName,
      grounding: grounding || { yearGroup: cls.year_group, subject: cls.subject },
      totalMarks: effectiveTotalMarks,
      mode: effectiveMode,
    });

    // Dynamic max_tokens based on total marks
    const maxTokens = Math.min(16000, Math.max(4000, effectiveMarks * 120));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an educational quiz generator for UK secondary school exams. Generate age-appropriate, curriculum-aligned questions. Always return valid JSON arrays only.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    let questions;
    try {
      const responseText = completion.choices[0].message.content.trim();
      const cleanedResponse = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      questions = JSON.parse(cleanedResponse);
    } catch {
      return NextResponse.json({ error: 'Failed to generate valid quiz questions' }, { status: 500 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Invalid quiz format - no questions generated' }, { status: 500 });
    }

    // Ensure every question has a marks field
    questions = questions.map(q => ({ ...q, marks: q.marks || 1 }));

    // Randomize numeric values in STEM questions
    questions = await randomizeQuizNumbers(questions, cls.subject);

    // Insert quiz assignment
    const { data: assignment, error: insertError } = await supabaseAdmin
      .from('quiz_assignments')
      .insert({
        teacher_id: user.id,
        class_id: classId,
        subject: cls.subject,
        topic_name: topicName,
        questions,
        due_date: dueDate || null,
        status: 'published',
        total_marks: effectiveMarks,
        mode: effectiveMode,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating quiz assignment:', insertError);
      return NextResponse.json({ error: 'Failed to create quiz assignment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('Quiz assign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const user = await authenticateTeacher(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 });
    }

    // Verify teacher owns class
    const { data: cls } = await supabaseAdmin
      .from('classes')
      .select('id, teacher_id')
      .eq('id', classId)
      .single();

    if (!cls || (cls.teacher_id !== user.id && !user.is_admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get quiz assignments for this class
    const { data: assignments, error } = await supabaseAdmin
      .from('quiz_assignments')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to load quiz assignments' }, { status: 500 });
    }

    // Get student count for this class
    const { data: studentCount } = await supabaseAdmin
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId);

    const totalStudents = studentCount?.length || 0;

    // For each assignment, get completion counts
    const assignmentIds = (assignments || []).map(a => a.id);
    let completionMap = {};

    if (assignmentIds.length > 0) {
      const { data: quizzes } = await supabaseAdmin
        .from('quizzes')
        .select('quiz_assignment_id, status')
        .in('quiz_assignment_id', assignmentIds);

      for (const q of (quizzes || [])) {
        if (!completionMap[q.quiz_assignment_id]) {
          completionMap[q.quiz_assignment_id] = { started: 0, completed: 0 };
        }
        completionMap[q.quiz_assignment_id].started++;
        if (q.status === 'completed') {
          completionMap[q.quiz_assignment_id].completed++;
        }
      }
    }

    const enriched = (assignments || []).map(a => ({
      ...a,
      totalStudents,
      studentsStarted: completionMap[a.id]?.started || 0,
      studentsCompleted: completionMap[a.id]?.completed || 0,
    }));

    return NextResponse.json({ assignments: enriched });
  } catch (error) {
    console.error('Quiz assign GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
