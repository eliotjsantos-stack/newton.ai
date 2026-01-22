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
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('chat_data, email')
      .eq('id', decoded.userId)
      .single();

    if (error) {
      console.error('Error loading chat:', error);
      return NextResponse.json(
        { error: 'Failed to load chat' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chatData: user.chat_data || null,
      email: user.email
    });

  } catch (error) {
    console.error('Load chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
