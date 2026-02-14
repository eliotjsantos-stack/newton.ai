import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { generateClassCode } from '@/lib/classCode';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(req, { params }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, account_type, is_admin')
    .eq('id', decoded.userId)
    .single();

  if (!user || (!user.is_admin && user.account_type !== 'teacher')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  // Verify ownership
  const { data: existing } = await supabase
    .from('classes')
    .select('id')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

  let newCode;
  let attempts = 0;
  while (attempts < 5) {
    newCode = generateClassCode();
    const { data: dup } = await supabase.from('classes').select('id').eq('class_code', newCode).single();
    if (!dup) break;
    attempts++;
  }

  const { data: updated, error } = await supabase
    .from('classes')
    .update({ class_code: newCode })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to regenerate code' }, { status: 500 });
  }

  return NextResponse.json({ success: true, classCode: updated.class_code });
}
