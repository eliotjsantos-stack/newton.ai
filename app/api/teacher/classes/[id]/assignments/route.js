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

  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single();

  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

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

export async function POST(req, { params }) {
  const user = await authenticateTeacher(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single();

  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

  const { title, description, dueDate } = await req.json();
  if (!title || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { data: assignment, error } = await supabase
    .from('class_assignments')
    .insert({
      class_id: id,
      title: title.trim(),
      description: description?.trim() || null,
      due_date: dueDate || null,
    })
    .select('id, title, description, due_date, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }

  return NextResponse.json({ assignment });
}

export async function DELETE(req, { params }) {
  const user = await authenticateTeacher(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const { assignmentId } = await req.json();

  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single();

  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

  const { error } = await supabase
    .from('class_assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('class_id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
