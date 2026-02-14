import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(req, { params }) {
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

  const { id } = await params;

  // Verify student is enrolled
  const { data: enrolment } = await supabase
    .from('class_students')
    .select('id')
    .eq('class_id', id)
    .eq('student_id', decoded.userId)
    .single();

  if (!enrolment) {
    return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 403 });
  }

  const { data: assignments, error } = await supabase
    .from('class_assignments')
    .select('id, title, description, due_date, created_at')
    .eq('class_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }

  return NextResponse.json({ assignments: assignments || [] });
}
