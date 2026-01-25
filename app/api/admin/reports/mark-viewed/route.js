import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify admin
    const { data: requestingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', decoded.userId)
      .single();

    if (userError || !requestingUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Mark all reports as viewed
    const { error } = await supabaseAdmin
      .from('issue_reports')
      .update({ viewed: true })
      .eq('viewed', false);

    if (error) {
      console.error('Failed to mark reports as viewed:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Mark viewed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}