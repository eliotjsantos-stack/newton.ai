import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function PATCH(req) {
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

    const { fullName, preferredTitle, qanCode, parentEmail, parentPhone, parentName, notificationsEnabled } = await req.json();

    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName || null;
    if (preferredTitle !== undefined) updates.preferred_title = preferredTitle || null;
    if (qanCode !== undefined) updates.qan_code = qanCode || null;
    if (parentEmail !== undefined) updates.parent_email = parentEmail || null;
    if (parentPhone !== undefined) updates.parent_phone = parentPhone || null;
    if (parentName !== undefined) updates.parent_name = parentName || null;
    if (notificationsEnabled !== undefined) updates.notifications_enabled = notificationsEnabled;

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', decoded.userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
