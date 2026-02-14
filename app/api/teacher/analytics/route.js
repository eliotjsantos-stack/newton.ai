import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * GET /api/teacher/analytics
 *
 * Aggregates a mastery heatmap matrix: student x syllabus chapter.
 * Also returns integrity flags and a priority list (bottom 5 by inactivity/decay).
 */
export async function GET(req) {
  try {
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
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 });
    }

    // Verify teacher owns this class
    const { data: classData, error: classError } = await supabaseAdmin
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

    // Get students in this class
    const { data: enrollments } = await supabaseAdmin
      .from('class_students')
      .select('student_id, users(id, full_name, email)')
      .eq('class_id', classId);

    const students = (enrollments || []).map(e => ({
      id: e.student_id,
      name: e.users?.full_name || e.users?.email || 'Unknown',
    }));

    const studentIds = students.map(s => s.id);
    if (studentIds.length === 0) {
      return NextResponse.json({
        students: [],
        chapters: [],
        cells: [],
        priorityList: [],
        className: classData.name,
      });
    }

    // Get mastery records for these students
    const { data: masteryRecords } = await supabaseAdmin
      .from('student_mastery')
      .select('user_id, curriculum_topic, mastery_level, status, last_activity_at, last_quiz_at')
      .in('user_id', studentIds)
      .eq('subject', classData.subject);

    // Extract unique chapters (curriculum topics)
    const chapterSet = new Set((masteryRecords || []).map(m => m.curriculum_topic));
    const chapters = [...chapterSet].sort();

    // Build heatmap cells: { studentId, chapter, masteryLevel, status }
    const cells = (masteryRecords || []).map(m => ({
      studentId: m.user_id,
      chapter: m.curriculum_topic,
      masteryLevel: m.mastery_level || 0,
      status: m.status || 'red',
      lastQuizAt: m.last_quiz_at,
    }));

    // Get integrity flags (tab switches in past 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: integrityLogs } = await supabaseAdmin
      .from('integrity_logs')
      .select('user_id')
      .in('user_id', studentIds)
      .eq('event_type', 'TAB_SWITCH')
      .gte('created_at', weekAgo);

    // Count per student
    const integrityFlags = {};
    (integrityLogs || []).forEach(log => {
      integrityFlags[log.user_id] = (integrityFlags[log.user_id] || 0) + 1;
    });

    // Priority list: bottom 5 by inactivity or high decay
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const studentActivity = {};
    (masteryRecords || []).forEach(m => {
      if (!studentActivity[m.user_id] || m.last_activity_at > studentActivity[m.user_id]) {
        studentActivity[m.user_id] = m.last_activity_at;
      }
    });

    const priorityList = students
      .map(s => {
        const lastActivity = studentActivity[s.id];
        const isInactive = !lastActivity || lastActivity < threeDaysAgo;
        const decayCount = (masteryRecords || []).filter(
          m => m.user_id === s.id && m.status === 'amber'
        ).length;
        const tabSwitches = integrityFlags[s.id] || 0;

        return {
          ...s,
          lastActivity,
          isInactive,
          decayCount,
          tabSwitches,
          urgencyScore: (isInactive ? 10 : 0) + decayCount * 2 + (tabSwitches > 3 ? 5 : 0),
        };
      })
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 5);

    return NextResponse.json({
      students,
      chapters,
      cells,
      integrityFlags,
      priorityList,
      className: classData.name,
      subject: classData.subject,
    });
  } catch (err) {
    console.error('Teacher analytics error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
