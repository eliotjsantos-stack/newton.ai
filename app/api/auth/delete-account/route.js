import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function DELETE(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Get chat IDs first so we can delete their child rows
    const { data: chats } = await supabase
      .from('user_chats')
      .select('id')
      .eq('user_id', userId);

    const chatIds = (chats || []).map(c => c.id);

    if (chatIds.length > 0) {
      await supabase.from('messages').delete().in('chat_id', chatIds);
      await supabase.from('topics_discussed').delete().in('chat_id', chatIds);
    }

    // Delete all rows linked to this user across every table
    const userLinkedTables = [
      { table: 'understanding_ratings', col: 'user_id' },
      { table: 'quiz_attempts',         col: 'user_id' },
      { table: 'quizzes',               col: 'created_by' },
      { table: 'student_mastery',       col: 'user_id' },
      { table: 'student_subjects',      col: 'user_id' },
      { table: 'refresher_missions',    col: 'user_id' },
      { table: 'class_memberships',     col: 'user_id' },
      { table: 'class_students',        col: 'student_id' },
      { table: 'integrity_logs',        col: 'user_id' },
      { table: 'issue_reports',         col: 'user_id' },
      { table: 'notifications',         col: 'user_id' },
      { table: 'admin_logs',            col: 'user_id' },
      { table: 'verification_codes',    col: 'user_id' },
      { table: 'password_reset_tokens', col: 'user_id' },
      { table: 'user_chats',            col: 'user_id' },
    ];

    for (const { table, col } of userLinkedTables) {
      await supabase.from(table).delete().eq(col, userId);
    }

    // Finally delete the user record itself
    await supabase.from('users').delete().eq('id', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
