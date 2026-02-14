import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

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

    const userId = decoded.userId;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const since = sixMonthsAgo.toISOString();

    // Fetch message activity (chat messages sent by this user)
    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('created_at')
      .eq('user_id', userId)
      .eq('role', 'user')
      .gte('created_at', since);

    // Fetch quiz activity
    const { data: quizzes } = await supabaseAdmin
      .from('quizzes')
      .select('created_at, completed_at')
      .eq('user_id', userId)
      .gte('created_at', since);

    // Aggregate into daily counts
    const activity = {};

    (messages || []).forEach((m) => {
      const day = m.created_at.split('T')[0];
      activity[day] = (activity[day] || 0) + 1;
    });

    // Quizzes count 3x (they represent more effort)
    (quizzes || []).forEach((q) => {
      const day = q.created_at.split('T')[0];
      activity[day] = (activity[day] || 0) + 3;
      if (q.completed_at) {
        const completedDay = q.completed_at.split('T')[0];
        if (completedDay !== day) {
          activity[completedDay] = (activity[completedDay] || 0) + 3;
        }
      }
    });

    // Calculate streak (consecutive days with activity, counting backwards from today)
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (activity[key]) {
        streak++;
      } else if (i > 0) {
        // Allow today to have no activity (day not over yet)
        break;
      }
    }

    const totalDays = Object.keys(activity).length;

    return NextResponse.json({ activity, streak, totalDays });
  } catch (err) {
    console.error('Activity error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
