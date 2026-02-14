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

    const { data: enrolments, error } = await supabase
      .from('class_students')
      .select('class_id, joined_at')
      .eq('student_id', decoded.userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });
    }

    if (!enrolments || enrolments.length === 0) {
      return NextResponse.json({ classes: [] });
    }

    const classIds = enrolments.map(e => e.class_id);
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name, subject, year_group, color, icon, archived, teacher_id, qan_code, users!classes_teacher_id_fkey(full_name, preferred_title)')
      .in('id', classIds);

    // Fetch qualification titles for classes with qan_codes
    const qanCodes = [...new Set((classes || []).map(c => c.qan_code).filter(Boolean))];
    let qualMap = {};
    if (qanCodes.length > 0) {
      const { data: quals } = await supabase
        .from('qualifications')
        .select('qan_code, title, board')
        .in('qan_code', qanCodes);
      for (const q of (quals || [])) {
        qualMap[q.qan_code] = { qualTitle: q.title, board: q.board };
      }
    }

    const joined = (classes || []).map(cls => {
      const enrolment = enrolments.find(e => e.class_id === cls.id);
      const teacher = cls.users;
      let teacherName = null;
      if (teacher) {
        const title = teacher.preferred_title || '';
        const name = teacher.full_name || '';
        teacherName = title && name ? `${title} ${name}` : name || title || null;
      }
      const qual = cls.qan_code ? qualMap[cls.qan_code] : null;
      return {
        ...cls,
        joinedAt: enrolment?.joined_at,
        teacherName,
        qualTitle: qual?.qualTitle || null,
        board: qual?.board || null,
      };
    });

    return NextResponse.json({ classes: joined });
  } catch (err) {
    console.error('Student classes error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
