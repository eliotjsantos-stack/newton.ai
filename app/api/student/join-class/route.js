import { supabase, supabaseAdmin } from '@/lib/supabase';
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

    const { code } = await req.json();
    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Class code is required' }, { status: 400 });
    }

    // Normalize code: strip spaces, uppercase
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Try matching with and without dash
    const withDash = normalized.length === 8
      ? `${normalized.slice(0, 4)}-${normalized.slice(4)}`
      : code.trim().toUpperCase();

    // Find class by code
    const { data: cls, error: classError } = await supabase
      .from('classes')
      .select('id, name, subject, year_group, color, icon, class_code, archived, max_capacity, welcome_message, qan_code, teacher_id')
      .or(`class_code.eq.${withDash},class_code.eq.${normalized}`)
      .single();

    if (classError || !cls) {
      return NextResponse.json({ error: 'Invalid class code. Please check and try again.' }, { status: 404 });
    }

    if (cls.archived) {
      return NextResponse.json({ error: 'This class has been archived and is no longer accepting students.' }, { status: 400 });
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from('class_students')
      .select('id')
      .eq('class_id', cls.id)
      .eq('student_id', decoded.userId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You have already joined this class.' }, { status: 400 });
    }

    // Check capacity
    if (cls.max_capacity) {
      const { count } = await supabase
        .from('class_students')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', cls.id);

      if (count >= cls.max_capacity) {
        return NextResponse.json({ error: 'This class is full.' }, { status: 400 });
      }
    }

    // Join the class
    const { error: joinError } = await supabase
      .from('class_students')
      .insert({ class_id: cls.id, student_id: decoded.userId });

    if (joinError) {
      console.error('Join class error:', joinError);
      return NextResponse.json({ error: 'Failed to join class' }, { status: 500 });
    }

    // Auto-enroll the student in a chat subject for this class (uses admin to bypass RLS)
    try {
      let subjectRow = null;

      // First try to find an existing subject matching this class
      if (cls.qan_code) {
        const { data: byQan } = await supabaseAdmin
          .from('subjects')
          .select('id')
          .eq('qan_code', cls.qan_code)
          .limit(1);
        if (byQan?.length > 0) subjectRow = byQan[0];
      }

      if (!subjectRow) {
        // Try matching by name (case-insensitive)
        const { data: byName } = await supabaseAdmin
          .from('subjects')
          .select('id')
          .ilike('name', cls.subject)
          .limit(1);
        if (byName?.length > 0) subjectRow = byName[0];
      }

      // If no subject exists, create one
      if (!subjectRow) {
        const { data: created } = await supabaseAdmin
          .from('subjects')
          .insert({
            name: cls.subject,
            qan_code: cls.qan_code || null,
            teacher_id: cls.teacher_id,
          })
          .select('id')
          .single();
        subjectRow = created;
      }

      // Enroll the student in the subject (ignore duplicate)
      if (subjectRow) {
        await supabaseAdmin
          .from('student_subjects')
          .insert({ student_id: decoded.userId, subject_id: subjectRow.id })
          .then(({ error }) => {
            // Ignore unique violation (already enrolled)
            if (error && error.code !== '23505') throw error;
          });
      }
    } catch (subjectErr) {
      console.error('Auto-enroll in subject error (non-fatal):', subjectErr);
    }

    return NextResponse.json({
      success: true,
      class: {
        id: cls.id,
        name: cls.name,
        subject: cls.subject,
        yearGroup: cls.year_group,
        color: cls.color,
        icon: cls.icon,
        welcomeMessage: cls.welcome_message,
      },
    });
  } catch (err) {
    console.error('Join class error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
