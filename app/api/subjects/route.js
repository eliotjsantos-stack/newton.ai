import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * GET /api/subjects — Returns subjects the current user is enrolled in.
 */
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

    // Sync: ensure the student has subject rows for all their classes
    try {
      const { data: classEnrolments } = await supabaseAdmin
        .from('class_students')
        .select('class_id, classes(id, subject, qan_code, teacher_id)')
        .eq('student_id', decoded.userId);

      if (classEnrolments?.length > 0) {
        const { data: existingEnrolments } = await supabaseAdmin
          .from('student_subjects')
          .select('subject_id, subjects(name, qan_code)')
          .eq('student_id', decoded.userId);

        const enrolledSubjectNames = new Set(
          (existingEnrolments || []).map(e => e.subjects?.name?.toLowerCase())
        );
        const enrolledQanCodes = new Set(
          (existingEnrolments || []).map(e => e.subjects?.qan_code).filter(Boolean)
        );

        for (const ce of classEnrolments) {
          const cls = ce.classes;
          if (!cls) continue;

          // Skip if already enrolled in a subject matching this class
          const hasMatch = (cls.qan_code && enrolledQanCodes.has(cls.qan_code)) ||
            enrolledSubjectNames.has(cls.subject?.toLowerCase());
          if (hasMatch) continue;

          // Find or create the subject
          let subjectRow = null;
          if (cls.qan_code) {
            const { data: byQan } = await supabaseAdmin
              .from('subjects')
              .select('id')
              .eq('qan_code', cls.qan_code)
              .limit(1);
            if (byQan?.length > 0) subjectRow = byQan[0];
          }
          if (!subjectRow) {
            const { data: byName } = await supabaseAdmin
              .from('subjects')
              .select('id')
              .ilike('name', cls.subject)
              .limit(1);
            if (byName?.length > 0) subjectRow = byName[0];
          }
          if (!subjectRow) {
            const { data: created } = await supabaseAdmin
              .from('subjects')
              .insert({ name: cls.subject, qan_code: cls.qan_code || null, teacher_id: cls.teacher_id })
              .select('id')
              .single();
            subjectRow = created;
          }

          if (subjectRow) {
            const { error: enrollErr } = await supabaseAdmin
              .from('student_subjects')
              .insert({ student_id: decoded.userId, subject_id: subjectRow.id });
            // Ignore unique violation (already enrolled)
            if (enrollErr && enrollErr.code !== '23505') {
              console.error('Subject enroll error:', enrollErr);
            }
          }
        }
      }
    } catch (syncErr) {
      console.error('Subject sync error (non-fatal):', syncErr);
    }

    // Get subject IDs the user is enrolled in
    const { data: enrollments, error: eErr } = await supabaseAdmin
      .from('student_subjects')
      .select('subject_id')
      .eq('student_id', decoded.userId);

    if (eErr) {
      console.error('Enrollment fetch error:', eErr);
      return NextResponse.json({ error: 'Failed to load subjects' }, { status: 500 });
    }

    let subjectIds = enrollments.map(e => e.subject_id);

    // Auto-enroll students (not teachers) in General if missing
    const generalId = '00000000-0000-0000-0000-000000000001';
    if (!subjectIds.includes(generalId)) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('account_type')
        .eq('id', decoded.userId)
        .single();
      if (user?.account_type !== 'teacher') {
        await supabaseAdmin
          .from('student_subjects')
          .insert({ student_id: decoded.userId, subject_id: generalId })
          .then(({ error }) => { if (error && error.code !== '23505') console.error('General enroll error:', error); });
        subjectIds.push(generalId);
      }
    }

    if (subjectIds.length === 0) {
      return NextResponse.json({ subjects: [] });
    }

    const { data: subjects, error: sErr } = await supabaseAdmin
      .from('subjects')
      .select('id, name, qan_code, qualifications(title, board, level)')
      .in('id', subjectIds)
      .order('name');

    if (sErr) {
      console.error('Subjects fetch error:', sErr);
      return NextResponse.json({ error: 'Failed to load subjects' }, { status: 500 });
    }

    return NextResponse.json({
      subjects: subjects.map(s => {
        // Derive a friendly display name from the qualification title
        // e.g. "AQA Level 3 Advanced GCE in Economics" → "Economics"
        let displayName = s.name;
        const qualTitle = s.qualifications?.title || null;
        if (qualTitle) {
          displayName = qualTitle
            .replace(/^(AQA|OCR|Pearson|WJEC|Pearson Edexcel)\s*/i, '')
            .replace(/Level \d\/?(Level \d)?\s*/i, '')
            .replace(/GCSE \(9-1\) in\s*/i, '')
            .replace(/Advanced (Subsidiary )?GCE in\s*/i, '')
            .replace(/GCE\s*/i, '')
            .trim() || s.name;
        }
        return {
          id: s.id,
          name: displayName,
          qanCode: s.qan_code,
          board: s.qualifications?.board || null,
          level: s.qualifications?.level || null,
          qualTitle,
        };
      }),
    });
  } catch (err) {
    console.error('Subjects error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/subjects — Create a new subject (teachers) or enroll in existing.
 * Body: { name, qanCode? } or { subjectId } for enrollment
 */
export async function POST(req) {
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

    const body = await req.json();

    // Enrollment: just link student to existing subject
    if (body.subjectId) {
      const { error } = await supabaseAdmin
        .from('student_subjects')
        .insert({ student_id: decoded.userId, subject_id: body.subjectId })
        .select()
        .single();

      if (error?.code === '23505') {
        return NextResponse.json({ success: true, message: 'Already enrolled' });
      }
      if (error) {
        return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Creation: create subject + auto-enroll
    const { name, qanCode } = body;
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: newSubject, error: createErr } = await supabaseAdmin
      .from('subjects')
      .insert({
        name,
        qan_code: qanCode || null,
        teacher_id: decoded.userId,
      })
      .select()
      .single();

    if (createErr) {
      console.error('Create subject error:', createErr);
      return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
    }

    // Auto-enroll the creator
    await supabaseAdmin
      .from('student_subjects')
      .insert({ student_id: decoded.userId, subject_id: newSubject.id });

    return NextResponse.json({ success: true, subject: newSubject });
  } catch (err) {
    console.error('Subject create error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
