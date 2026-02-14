import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * GET /api/teacher/classes/[id]/mastery
 *
 * Returns student mastery data for a teacher's class, including:
 * - Per-student mastery levels
 * - Common blind spots across the class
 * - Topic-by-topic breakdown
 */
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

    // Get all mastery records for this class
    let masteryQuery = supabase
      .from('student_mastery')
      .select(`
        id,
        user_id,
        subject,
        level,
        curriculum_topic,
        specific_topic,
        blind_spots,
        recommended_focus,
        summary,
        confidence_score,
        mastery_level,
        message_count,
        analyzed_at,
        users!inner(email, year_group)
      `)
      .eq('class_id', classId);

    if (startDate) {
      masteryQuery = masteryQuery.gte('analyzed_at', startDate);
    }
    if (endDate) {
      masteryQuery = masteryQuery.lte('analyzed_at', endDate);
    }
    if (studentId) {
      masteryQuery = masteryQuery.eq('user_id', studentId);
    }

    const { data: masteryRecords, error: masteryError } = await masteryQuery;

    if (masteryError) {
      console.error('Error fetching mastery records:', masteryError);
      return NextResponse.json({ error: 'Failed to fetch mastery data' }, { status: 500 });
    }

    // Aggregate blind spots across the class
    const blindSpotCounts = {};
    (masteryRecords || []).forEach(record => {
      (record.blind_spots || []).forEach(spot => {
        if (!blindSpotCounts[spot]) {
          blindSpotCounts[spot] = {
            blindSpot: spot,
            studentCount: new Set(),
            occurrences: 0,
            topics: new Set()
          };
        }
        blindSpotCounts[spot].studentCount.add(record.user_id);
        blindSpotCounts[spot].occurrences++;
        if (record.specific_topic) {
          blindSpotCounts[spot].topics.add(record.specific_topic);
        }
      });
    });

    const classBlindSpots = Object.values(blindSpotCounts)
      .map(bs => ({
        blindSpot: bs.blindSpot,
        studentCount: bs.studentCount.size,
        occurrences: bs.occurrences,
        relatedTopics: Array.from(bs.topics)
      }))
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 15);

    // Per-student mastery summary
    const studentMastery = {};
    (masteryRecords || []).forEach(record => {
      if (!studentMastery[record.user_id]) {
        studentMastery[record.user_id] = {
          userId: record.user_id,
          email: record.users?.email || 'Unknown',
          yearGroup: record.users?.year_group,
          sessions: 0,
          totalMastery: 0,
          blindSpots: [],
          topics: new Set(),
          recentSummary: null
        };
      }
      const student = studentMastery[record.user_id];
      student.sessions++;
      student.totalMastery += record.mastery_level || 3;
      student.blindSpots.push(...(record.blind_spots || []));
      if (record.specific_topic) {
        student.topics.add(record.specific_topic);
      }
      // Keep the most recent summary
      if (!student.recentSummary || new Date(record.analyzed_at) > new Date(student.lastAnalyzed || 0)) {
        student.recentSummary = record.summary;
        student.lastAnalyzed = record.analyzed_at;
      }
    });

    const studentList = Object.values(studentMastery).map(s => {
      // Count unique blind spots
      const uniqueBlindSpots = [...new Set(s.blindSpots)];
      return {
        userId: s.userId,
        email: s.email,
        visibleName: s.email?.split('@')[0] || 'Unknown',
        yearGroup: s.yearGroup,
        sessions: s.sessions,
        averageMastery: s.sessions > 0 ? (s.totalMastery / s.sessions).toFixed(1) : 0,
        topicsCovered: s.topics.size,
        uniqueBlindSpots: uniqueBlindSpots.length,
        topBlindSpots: uniqueBlindSpots.slice(0, 3),
        recentSummary: s.recentSummary
      };
    }).sort((a, b) => parseFloat(a.averageMastery) - parseFloat(b.averageMastery)); // Lowest mastery first (need help)

    // Topic mastery breakdown
    const topicMastery = {};
    (masteryRecords || []).forEach(record => {
      const topic = record.specific_topic || record.curriculum_topic;
      if (!topic) return;

      if (!topicMastery[topic]) {
        topicMastery[topic] = {
          topic,
          curriculumTopic: record.curriculum_topic,
          students: new Set(),
          totalMastery: 0,
          sessions: 0,
          blindSpots: []
        };
      }
      const tm = topicMastery[topic];
      tm.students.add(record.user_id);
      tm.totalMastery += record.mastery_level || 3;
      tm.sessions++;
      tm.blindSpots.push(...(record.blind_spots || []));
    });

    const topicList = Object.values(topicMastery)
      .map(t => ({
        topic: t.topic,
        curriculumTopic: t.curriculumTopic,
        studentCount: t.students.size,
        sessions: t.sessions,
        averageMastery: t.sessions > 0 ? (t.totalMastery / t.sessions).toFixed(1) : 0,
        commonBlindSpots: [...new Set(t.blindSpots)].slice(0, 3)
      }))
      .sort((a, b) => parseFloat(a.averageMastery) - parseFloat(b.averageMastery)); // Lowest mastery first

    // Calculate class-wide stats
    const totalRecords = masteryRecords?.length || 0;
    const totalMastery = (masteryRecords || []).reduce((sum, r) => sum + (r.mastery_level || 3), 0);
    const avgConfidence = (masteryRecords || []).reduce((sum, r) => sum + (r.confidence_score || 5), 0);

    // Identify students needing intervention (mastery < 2.5 average)
    const studentsNeedingHelp = studentList.filter(s => parseFloat(s.averageMastery) < 2.5);

    return NextResponse.json({
      success: true,
      className: classData.name,
      subject: classData.subject,
      stats: {
        totalSessions: totalRecords,
        studentsAnalyzed: Object.keys(studentMastery).length,
        averageMastery: totalRecords > 0 ? (totalMastery / totalRecords).toFixed(1) : 0,
        averageConfidence: totalRecords > 0 ? (avgConfidence / totalRecords).toFixed(1) : 0,
        studentsNeedingHelp: studentsNeedingHelp.length
      },
      classBlindSpots,
      studentMastery: studentList,
      topicMastery: topicList,
      studentsNeedingHelp,
      recentAnalysis: (masteryRecords || [])
        .sort((a, b) => new Date(b.analyzed_at) - new Date(a.analyzed_at))
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          visibleName: r.users?.email?.split('@')[0] || 'Unknown',
          topic: r.specific_topic || r.curriculum_topic,
          mastery: r.mastery_level,
          confidence: r.confidence_score,
          summary: r.summary,
          analyzedAt: r.analyzed_at
        }))
    });

  } catch (error) {
    console.error('Teacher mastery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
