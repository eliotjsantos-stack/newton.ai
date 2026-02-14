import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(req) {
  try {
    // Verify JWT token
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const subject = searchParams.get('subject');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('topics_discussed')
      .select('*')
      .eq('user_id', decoded.userId)
      .order('last_discussed_at', { ascending: false })
      .limit(limit);

    if (classId) {
      query = query.eq('class_id', classId);
    }

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data: topics, error } = await query;

    if (error) {
      console.error('Error fetching topics:', error);
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }

    // Get the current active topic (most recent with high message count)
    const activeTopic = topics.find(t => t.message_count >= 5) || topics[0] || null;

    return NextResponse.json({
      success: true,
      topics: topics || [],
      activeTopic,
      total: topics?.length || 0
    });

  } catch (error) {
    console.error('User topics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
