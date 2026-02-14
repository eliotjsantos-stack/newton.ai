import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

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

    const { flag, latencyMs, sessionId, sessionType } = await req.json();

    if (!flag || !latencyMs) {
      return NextResponse.json({ error: 'flag and latencyMs are required' }, { status: 400 });
    }

    await supabaseAdmin.from('integrity_logs').insert({
      user_id: decoded.userId,
      session_type: sessionType || 'chat',
      session_id: sessionId || null,
      event_type: 'RESPONSE_LATENCY',
      metadata: { flag, latencyMs },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Latency log error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
