import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(req) {
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

    const { topic, subtopic, subject, classId, conversationContext } = await req.json();

    if (!topic || !subject) {
      return NextResponse.json({ error: 'Topic and subject are required' }, { status: 400 });
    }

    // Check if this topic already exists for this user/class combination
    const { data: existingTopic, error: fetchError } = await supabase
      .from('topics_discussed')
      .select('*')
      .eq('user_id', decoded.userId)
      .eq('topic', topic)
      .eq('class_id', classId || null)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('Error checking existing topic:', fetchError);
    }

    let result;
    if (existingTopic) {
      // Update existing topic - increment message count
      const { data, error } = await supabase
        .from('topics_discussed')
        .update({
          message_count: existingTopic.message_count + 1,
          last_discussed_at: new Date().toISOString(),
          subtopic: subtopic || existingTopic.subtopic,
          conversation_context: conversationContext || existingTopic.conversation_context
        })
        .eq('id', existingTopic.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating topic:', error);
        return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
      }
      result = data;
    } else {
      // Insert new topic
      const { data, error } = await supabase
        .from('topics_discussed')
        .insert({
          user_id: decoded.userId,
          class_id: classId || null,
          subject,
          topic,
          subtopic: subtopic || null,
          message_count: 1,
          conversation_context: conversationContext || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting topic:', error);
        return NextResponse.json({ error: 'Failed to save topic' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({
      success: true,
      topic: result,
      isNew: !existingTopic
    });

  } catch (error) {
    console.error('Topic tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
