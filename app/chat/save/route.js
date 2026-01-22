import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(req) {
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

    const { chatsBySubject, currentSubject, currentChatId, subjects } = await req.json();

    const { error } = await supabase
      .from('users')
      .update({
        chat_data: {
          chatsBySubject,
          currentSubject,
          currentChatId,
          subjects,
          lastUpdated: new Date().toISOString()
        }
      })
      .eq('id', decoded.userId);

    if (error) {
      console.error('Error saving chat:', error);
      return NextResponse.json(
        { error: 'Failed to save chat' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Save chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}