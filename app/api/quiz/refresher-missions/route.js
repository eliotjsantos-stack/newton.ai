import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * GET /api/quiz/refresher-missions
 *
 * Returns pending refresher missions for the authenticated user.
 */
export async function GET(req) {
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

    // Fetch pending refresher missions with mastery topic info
    const { data: missions, error } = await supabaseAdmin
      .from('refresher_missions')
      .select('id, mastery_id, trigger_reason, due_at, created_at, student_mastery(curriculum_topic, subject)')
      .eq('user_id', decoded.userId)
      .eq('status', 'pending')
      .order('due_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Refresher missions fetch error:', error);
      return NextResponse.json({ missions: [] });
    }

    const formatted = (missions || []).map(m => ({
      id: m.id,
      mastery_id: m.mastery_id,
      trigger_reason: m.trigger_reason,
      topic: m.student_mastery?.curriculum_topic || 'Unknown topic',
      subject: m.student_mastery?.subject || 'General',
      due_at: m.due_at,
    }));

    return NextResponse.json({ missions: formatted });
  } catch (err) {
    console.error('Refresher missions error:', err);
    return NextResponse.json({ missions: [] });
  }
}
