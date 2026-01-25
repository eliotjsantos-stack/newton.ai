import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
console.log('🔑 Service role key exists?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('🔑 Service role key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify admin
    const { data: requestingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', decoded.userId)
      .single();

    if (userError || !requestingUser?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all reported issues
    const { data: reports, error } = await supabaseAdmin
      .from('issue_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports', details: error },
        { status: 500 }
      );
    }

    console.log('Found reports:', reports?.length || 0);
    // Count unviewed reports
const unviewedCount = reports?.filter(r => !r.viewed).length || 0;

return NextResponse.json({ 
  reports: reports || [], 
  unviewedCount 
});

  } catch (error) {
    console.error('Admin reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}