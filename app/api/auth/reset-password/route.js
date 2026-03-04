import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { token, password } = await req.json();

    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { data: resetRecord, error } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (error || !resetRecord) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      await supabaseAdmin.from('password_reset_tokens').delete().eq('token', token);
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', resetRecord.user_id);

    await supabaseAdmin.from('password_reset_tokens').delete().eq('token', token);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
