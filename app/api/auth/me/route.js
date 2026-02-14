import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

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
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('id, email, year_group, is_admin, account_type, full_name, preferred_title, created_at, last_login, qan_code')
      .eq('id', decoded.userId)
      .single();

    if (dbError || !user) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      yearGroup: user.year_group,
      isAdmin: user.is_admin || false,
      accountType: user.account_type || 'student',
      fullName: user.full_name || '',
      preferredTitle: user.preferred_title || '',
      createdAt: user.created_at,
      lastLogin: user.last_login,
      qanCode: user.qan_code || null
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}