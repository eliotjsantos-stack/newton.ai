import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendNotification } from '@/lib/email';
import { progressDigestTemplate, lowMasteryAlertTemplate } from '@/lib/emailTemplates';

/**
 * GET /api/cron/progress-digest
 *
 * Weekly cron (Fridays 9am UTC): sends progress digest emails to parents.
 * If any core subject mastery < 40% → sends low mastery alert instead.
 */
export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch students with parent emails enabled
    const { data: students, error: studentsErr } = await supabaseAdmin
      .from('users')
      .select('id, full_name, parent_email, parent_name, notifications_enabled')
      .not('parent_email', 'is', null)
      .eq('notifications_enabled', true);

    if (studentsErr) {
      console.error('Progress digest: students query error', studentsErr);
      return NextResponse.json({ error: 'Query error' }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No students with parent emails' });
    }

    let sentCount = 0;
    let alertCount = 0;

    for (const student of students) {
      // Fetch mastery data grouped by subject
      const { data: mastery } = await supabaseAdmin
        .from('student_mastery')
        .select('subject, status, last_quiz_score, last_quiz_at')
        .eq('user_id', student.id);

      if (!mastery || mastery.length === 0) continue;

      // Aggregate by subject
      const subjectMap = {};
      for (const m of mastery) {
        if (!subjectMap[m.subject]) {
          subjectMap[m.subject] = { name: m.subject, statuses: [], topicsCompleted: 0, quizzesTaken: 0 };
        }
        subjectMap[m.subject].statuses.push(m.status);
        if (m.status === 'green') subjectMap[m.subject].topicsCompleted++;
        if (m.last_quiz_at) subjectMap[m.subject].quizzesTaken++;
      }

      const subjects = Object.values(subjectMap).map(s => {
        const greenCount = s.statuses.filter(st => st === 'green').length;
        const total = s.statuses.length;
        const masteryPercent = total > 0 ? Math.round((greenCount / total) * 100) : 0;
        const overallStatus = masteryPercent >= 60 ? 'green' : masteryPercent >= 30 ? 'amber' : 'red';
        return { ...s, status: overallStatus, masteryPercent };
      });

      // Check for low mastery alerts (< 40%)
      const lowMasterySubjects = subjects.filter(s => s.masteryPercent < 40);

      if (lowMasterySubjects.length > 0) {
        // Send alert for the lowest subject
        const worst = lowMasterySubjects.sort((a, b) => a.masteryPercent - b.masteryPercent)[0];
        const template = lowMasteryAlertTemplate({
          studentName: student.full_name || 'Your child',
          parentName: student.parent_name,
          subject: worst.name,
          masteryPercent: worst.masteryPercent,
        });

        await sendNotification({
          to: student.parent_email,
          subject: template.subject,
          html: template.html,
          userId: student.id,
          notificationType: 'low_mastery_alert',
          supabase: supabaseAdmin,
        });
        alertCount++;
      } else {
        // Send weekly digest
        const template = progressDigestTemplate({
          studentName: student.full_name || 'Your child',
          parentName: student.parent_name,
          subjects,
        });

        await sendNotification({
          to: student.parent_email,
          subject: template.subject,
          html: template.html,
          userId: student.id,
          notificationType: 'weekly_digest',
          supabase: supabaseAdmin,
        });
      }

      sentCount++;
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      alerts: alertCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Progress digest cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
