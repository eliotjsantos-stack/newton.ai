import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    // Get the topic
    const { data: topic, error: topicError } = await supabase
      .from('topics_discussed')
      .select('id, topic, message_count, user_id')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    if (topic.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if user has already rated this topic recently (within the last 10 messages)
    const { data: recentRatings, error: ratingsError } = await supabase
      .from('understanding_ratings')
      .select('id, message_count_at_rating, created_at')
      .eq('topic_id', topicId)
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (ratingsError) {
      console.error('Error checking ratings:', ratingsError);
    }

    const lastRating = recentRatings?.[0];
    const messagesSinceLastRating = lastRating
      ? topic.message_count - (lastRating.message_count_at_rating || 0)
      : topic.message_count;

    // Show rating modal if:
    // 1. 10+ messages on topic AND
    // 2. Either no previous rating OR 10+ messages since last rating
    const shouldShowRating = topic.message_count >= 10 && messagesSinceLastRating >= 10;

    return NextResponse.json({
      success: true,
      shouldShowRating,
      topicName: topic.topic,
      messageCount: topic.message_count,
      messagesSinceLastRating,
      lastRatingDate: lastRating?.created_at || null
    });

  } catch (error) {
    console.error('Rating check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
