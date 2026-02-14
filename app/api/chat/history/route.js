import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const GENERAL_SUBJECT_ID = '00000000-0000-0000-0000-000000000001';

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId') || GENERAL_SUBJECT_ID;

    // Fetch all messages for this user + subject, grouped by chat_id
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('id, chat_id, role, content, created_at')
      .eq('user_id', decoded.userId)
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('History fetch error:', error);
      return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
    }

    // Group messages into chats
    const chatsMap = {};
    for (const msg of messages || []) {
      if (!chatsMap[msg.chat_id]) {
        chatsMap[msg.chat_id] = {
          id: msg.chat_id,
          messages: [],
          date: msg.created_at,
        };
      }
      chatsMap[msg.chat_id].messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Return as array sorted by most recent first
    const chats = Object.values(chatsMap).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    return NextResponse.json({ success: true, chats });
  } catch (err) {
    console.error('Chat history error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
