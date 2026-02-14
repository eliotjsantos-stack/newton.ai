import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

async function authenticateTeacher(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
    const { data: user } = await supabase
      .from('users')
      .select('id, account_type, is_admin')
      .eq('id', decoded.userId)
      .single();
    if (!user || (!user.is_admin && user.account_type !== 'teacher')) return null;
    return user;
  } catch {
    return null;
  }
}

export async function GET(req, { params }) {
  const user = await authenticateTeacher(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  // Verify ownership
  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single();

  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

  const { data: students, error } = await supabase
    .from('class_students')
    .select('id, joined_at, student_id, users(id, email, year_group)')
    .eq('class_id', id)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }

  const formatted = (students || []).map(s => ({
    id: s.id,
    studentId: s.student_id,
    email: s.users?.email,
    yearGroup: s.users?.year_group,
    joinedAt: s.joined_at,
  }));

  return NextResponse.json({ students: formatted });
}

export async function DELETE(req, { params }) {
  const user = await authenticateTeacher(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const { studentId } = await req.json();

  // Verify ownership
  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single();

  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

  const { error } = await supabase
    .from('class_students')
    .delete()
    .eq('class_id', id)
    .eq('student_id', studentId);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
