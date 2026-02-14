import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const GENERAL_SUBJECT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * POST /api/chat/messages
 * Saves a batch of messages to the messages table.
 * Body: { subjectId, chatId, messages: [{ role, content }] }
 */
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

    const { subjectId, chatId, messages } = await req.json();

    if (!chatId || !messages?.length) {
      return NextResponse.json({ error: 'chatId and messages are required' }, { status: 400 });
    }

    const resolvedSubjectId = subjectId || GENERAL_SUBJECT_ID;

    const rows = messages.map(msg => ({
      subject_id: resolvedSubjectId,
      user_id: decoded.userId,
      chat_id: chatId,
      role: msg.role,
      content: msg.content,
    }));

    const { error } = await supabaseAdmin
      .from('messages')
      .insert(rows);

    if (error) {
      console.error('Save messages error:', error);
      return NextResponse.json({ error: 'Failed to save messages' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (err) {
    console.error('Messages save error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
