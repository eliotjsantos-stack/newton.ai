import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(req, { params }) {
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

    const { id: classId } = await params;

    // Verify user is the teacher of this class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, teacher_id, name, subject')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (classData.teacher_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const studentId = searchParams.get('studentId');

    // Get all topics for this class
    let topicsQuery = supabase
      .from('topics_discussed')
      .select(`
        id,
        user_id,
        topic,
        subtopic,
        subject,
        message_count,
        first_discussed_at,
        last_discussed_at,
        users!inner(email, year_group)
      `)
      .eq('class_id', classId);

    if (startDate) {
      topicsQuery = topicsQuery.gte('last_discussed_at', startDate);
    }
    if (endDate) {
      topicsQuery = topicsQuery.lte('last_discussed_at', endDate);
    }
    if (studentId) {
      topicsQuery = topicsQuery.eq('user_id', studentId);
    }

    const { data: topics, error: topicsError } = await topicsQuery;

    if (topicsError) {
      console.error('Error fetching topics:', topicsError);
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }

    // Aggregate topic data
    const topicCounts = {};
    const studentTopics = {};

    (topics || []).forEach(topic => {
      // Aggregate by topic name
      if (!topicCounts[topic.topic]) {
        topicCounts[topic.topic] = {
          topic: topic.topic,
          totalMessages: 0,
          studentCount: 0,
          students: new Set()
        };
      }
      topicCounts[topic.topic].totalMessages += topic.message_count;
      topicCounts[topic.topic].students.add(topic.user_id);

      // Track per-student
      if (!studentTopics[topic.user_id]) {
        studentTopics[topic.user_id] = {
          userId: topic.user_id,
          email: topic.users?.email || 'Unknown',
          yearGroup: topic.users?.year_group,
          topics: []
        };
      }
      studentTopics[topic.user_id].topics.push({
        topic: topic.topic,
        messageCount: topic.message_count,
        lastDiscussed: topic.last_discussed_at
      });
    });

    // Convert to arrays and calculate student counts
    const topicList = Object.values(topicCounts).map(t => ({
      topic: t.topic,
      totalMessages: t.totalMessages,
      studentCount: t.students.size
    })).sort((a, b) => b.totalMessages - a.totalMessages);

    const studentList = Object.values(studentTopics).map(s => ({
      ...s,
      topicCount: s.topics.length,
      totalMessages: s.topics.reduce((sum, t) => sum + t.messageCount, 0)
    })).sort((a, b) => b.totalMessages - a.totalMessages);

    // Get understanding ratings for this class
    const { data: ratings, error: ratingsError } = await supabase
      .from('understanding_ratings')
      .select(`
        id,
        rating,
        topic_id,
        user_id,
        created_at,
        topics_discussed!inner(topic)
      `)
      .eq('class_id', classId);

    // Aggregate ratings by topic
    const topicRatings = {};
    (ratings || []).forEach(r => {
      const topicName = r.topics_discussed?.topic;
      if (!topicName) return;

      if (!topicRatings[topicName]) {
        topicRatings[topicName] = { total: 0, count: 0, ratings: [] };
      }
      topicRatings[topicName].total += r.rating;
      topicRatings[topicName].count += 1;
      topicRatings[topicName].ratings.push(r.rating);
    });

    // Calculate averages and identify struggling topics
    const ratingsSummary = Object.entries(topicRatings).map(([topic, data]) => ({
      topic,
      averageRating: data.count > 0 ? (data.total / data.count).toFixed(1) : null,
      ratingCount: data.count,
      isStruggling: data.count > 0 && (data.total / data.count) < 3
    })).sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0));

    return NextResponse.json({
      success: true,
      className: classData.name,
      subject: classData.subject,
      topics: topicList,
      students: studentList,
      ratings: ratingsSummary,
      totalTopics: topicList.length,
      totalStudentsEngaged: studentList.length,
      strugglingTopics: ratingsSummary.filter(r => r.isStruggling)
    });

  } catch (error) {
    console.error('Teacher topics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
