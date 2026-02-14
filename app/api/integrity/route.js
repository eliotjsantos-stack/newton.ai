import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(req) {
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

    const { sessionType, sessionId, eventType, metadata } = await req.json();

    if (!sessionType || !eventType) {
      return NextResponse.json({ error: 'sessionType and eventType are required' }, { status: 400 });
    }

    const validSessionTypes = ['chat', 'quiz'];
    const validEventTypes = ['TAB_SWITCH', 'PASTE_BLOCKED', 'PASTE_DETECTED', 'COPY_BLOCKED', 'FLASH_FIRE_RESULT', 'RESPONSE_LATENCY', 'SUSPECTED_LLM_INJECTION', 'LLM_PHRASE_DETECTED', 'PROCTORED_TAB_SWITCH'];

    if (!validSessionTypes.includes(sessionType)) {
      return NextResponse.json({ error: 'Invalid sessionType' }, { status: 400 });
    }
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('integrity_logs')
      .insert({
        user_id: decoded.userId,
        session_type: sessionType,
        session_id: sessionId || null,
        event_type: eventType,
        metadata: metadata || {},
      });

    if (error) {
      console.error('Integrity log insert error:', error);
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Integrity API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
