import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { generateClassCode } from '@/lib/classCode';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

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

    if (error) {
      console.error('Auth teacher query error:', error);
      return null;
    }
    if (!user || (!user.is_admin && user.account_type !== 'teacher')) return null;
    return user;
  } catch (err) {
    console.error('Auth teacher error:', err);
    return null;
  }
}

export async function GET(req) {
  const user = await authenticateTeacher(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { data: classes, error } = await supabaseAdmin
    .from('classes')
    .select('*, class_students(count)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }

  const formatted = (classes || []).map(c => ({
    ...c,
    student_count: c.class_students?.[0]?.count || 0,
  }));
  delete formatted.class_students;

  return NextResponse.json({ classes: formatted });
}

export async function POST(req) {
  const user = await authenticateTeacher(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  const { name, subject, yearGroup, description, color, icon, welcomeMessage, showClassmates, maxCapacity, schedule, archiveDate, qanCode } = body;

  if (!name || !subject || !yearGroup) {
    return NextResponse.json({ error: 'Name, subject, and year group are required' }, { status: 400 });
  }

  // Generate unique class code with retry
  let classCode;
  let attempts = 0;
  while (attempts < 5) {
    classCode = generateClassCode();
    const { data: existing } = await supabaseAdmin
      .from('classes')
      .select('id')
      .eq('class_code', classCode)
      .single();
    if (!existing) break;
    attempts++;
  }

  const { data: newClass, error } = await supabaseAdmin
    .from('classes')
    .insert({
      teacher_id: user.id,
      name,
      subject,
      year_group: yearGroup,
      description: description || null,
      color: color || '#3B82F6',
      icon: icon || 'book',
      welcome_message: welcomeMessage || null,
      show_classmates: showClassmates || false,
      max_capacity: maxCapacity || null,
      schedule: schedule || null,
      archive_date: archiveDate || null,
      class_code: classCode,
      qan_code: qanCode || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating class:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }

  // Auto-create a subject linked to this class's QAN for the grounding engine
  if (qanCode) {
    try {
      const subjectName = `${subject} (${name})`;
      const { data: newSubject } = await supabaseAdmin
        .from('subjects')
        .insert({
          name: subjectName,
          qan_code: qanCode,
          teacher_id: user.id,
        })
        .select()
        .single();

      if (newSubject) {
        // Enroll the teacher in the subject
        await supabaseAdmin
          .from('student_subjects')
          .insert({ student_id: user.id, subject_id: newSubject.id })
          .select()
          .maybeSingle();
      }
    } catch (subjectErr) {
      console.error('Auto-create subject error (non-fatal):', subjectErr);
    }
  }

  return NextResponse.json({ success: true, class: newClass });
}
