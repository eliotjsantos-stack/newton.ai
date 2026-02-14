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

  const { data: resources, error } = await supabase
    .from('class_resources')
    .select('id, title, url, description, type, created_at')
    .eq('class_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }

  return NextResponse.json({ resources: resources || [] });
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

  const { title, url, description, type } = await req.json();
  if (!title || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { data: resource, error } = await supabase
    .from('class_resources')
    .insert({
      class_id: id,
      title: title.trim(),
      url: url?.trim() || null,
      description: description?.trim() || null,
      type: type || 'link',
    })
    .select('id, title, url, description, type, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }

  return NextResponse.json({ resource });
}

export async function DELETE(req, { params }) {
  const user = await authenticateTeacher(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const { resourceId } = await req.json();

  const { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single();

  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

  const { error } = await supabase
    .from('class_resources')
    .delete()
    .eq('id', resourceId)
    .eq('class_id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
