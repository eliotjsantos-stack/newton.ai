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

  const { data: cls, error } = await supabase
    .from('classes')
    .select('*, class_students(count)')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single();

  if (error || !cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  return NextResponse.json({
    class: {
      ...cls,
      student_count: cls.class_students?.[0]?.count || 0,
    }
  });
}

export async function PATCH(req, { params }) {
  const user = await authenticateTeacher(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  // Verify ownership
  const { data: existing } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

  const updates = {};
  const fields = {
    name: 'name', subject: 'subject', yearGroup: 'year_group',
    description: 'description', color: 'color', icon: 'icon',
    welcomeMessage: 'welcome_message', showClassmates: 'show_classmates',
    maxCapacity: 'max_capacity', schedule: 'schedule',
    archiveDate: 'archive_date', archived: 'archived'
  };

  for (const [key, col] of Object.entries(fields)) {
    if (body[key] !== undefined) updates[col] = body[key];
  }

  const { data: updated, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating class:', error);
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
  }

  return NextResponse.json({ success: true, class: updated });
}

export async function DELETE(req, { params }) {
  const user = await authenticateTeacher(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id)
    .eq('teacher_id', user.id);

  if (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
