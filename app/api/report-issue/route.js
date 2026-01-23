import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { issue, userEmail, yearGroup, timestamp } = await req.json();
    
    if (!issue || !issue.trim()) {
      return NextResponse.json(
        { error: 'Issue description is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('issue_reports')
      .insert({
        issue: issue.trim(),
        user_email: userEmail || 'anonymous',
        year_group: yearGroup || 'not specified',
        created_at: timestamp
      });

    if (error) {
      console.error('Failed to save issue report:', error);
      return NextResponse.json(
        { error: 'Failed to save report' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Report issue error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}