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

    const { topicId, rating, unclearFeedback, messageCount, classId } = await req.json();

    if (!topicId || !rating) {
      return NextResponse.json({ error: 'Topic ID and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify the topic belongs to this user
    const { data: topic, error: topicError } = await supabase
      .from('topics_discussed')
      .select('id, user_id, topic')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    if (topic.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Insert the rating
    const { data: savedRating, error: insertError } = await supabase
      .from('understanding_ratings')
      .insert({
        user_id: decoded.userId,
        topic_id: topicId,
        class_id: classId || null,
        rating,
        unclear_feedback: unclearFeedback || null,
        message_count_at_rating: messageCount || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving rating:', insertError);
      return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rating: savedRating,
      topicName: topic.topic
    });

  } catch (error) {
    console.error('Rating submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
