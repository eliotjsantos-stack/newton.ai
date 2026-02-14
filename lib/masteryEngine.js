import { supabaseAdmin } from '@/lib/supabase';
import { sendNotification } from '@/lib/email';
import { milestoneCertificateTemplate } from '@/lib/emailTemplates';

const MILESTONES = [
  { count: 1, label: 'First Green Mastery' },
  { count: 5, label: '5 Topics Mastered' },
  { count: 10, label: '10 Topics Mastered' },
  { count: 20, label: 'Full Chapter Complete' },
];

/**
 * Check and trigger milestone certificates when a student reaches green mastery thresholds.
 */
async function checkMilestoneCertificate(userId, subject) {
  try {
    const { count } = await supabaseAdmin
      .from('student_mastery')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'green');

    const milestone = MILESTONES.find(m => m.count === count);
    if (!milestone) return;

    // Get student info
    const { data: student } = await supabaseAdmin
      .from('users')
      .select('name, email, parent_email')
      .eq('id', userId)
      .single();

    if (!student) return;

    const recipientEmail = student.parent_email || student.email;
    if (!recipientEmail) return;

    const template = milestoneCertificateTemplate({
      studentName: student.name || 'Student',
      parentName: null,
      milestone: milestone.label,
      subject: subject || 'General',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    });

    await sendNotification({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      userId,
      notificationType: 'milestone_certificate',
      supabase: supabaseAdmin,
    });
  } catch (err) {
    console.error('checkMilestoneCertificate error:', err);
  }
}

/**
 * Mastery Engine — Spaced repetition logic for Newton.
 *
 * Traffic-light model:
 *   RED   — student scored <100% on topic quiz (or never quizzed)
 *   AMBER — scored 100% on quiz, awaiting 48h retention check
 *   GREEN — passed retention check (≥80%)
 *
 * Decay: GREEN topics with no activity for 21+ days → AMBER + refresher mission
 */

/**
 * Called after a quiz is completed. Updates the student_mastery record.
 *
 * - 100% correct → status = 'amber', schedule retention check in 48h
 * - <100%        → status = 'red'
 */
export async function evaluateQuizCompletion(userId, quizId) {
  // Fetch quiz with answers
  const { data: quiz, error } = await supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single();

  if (error || !quiz) {
    console.error('evaluateQuizCompletion: quiz fetch error', error);
    return;
  }

  const answers = quiz.answers || [];
  const totalCorrect = answers.filter(a => a.isCorrect).length;
  const totalQuestions = answers.length;
  const scorePercent = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  const isPerfect = scorePercent === 100;

  const now = new Date();
  const retentionDue = isPerfect ? new Date(now.getTime() + 48 * 60 * 60 * 1000) : null;

  // Find or create mastery record for this topic
  const { data: existing } = await supabaseAdmin
    .from('student_mastery')
    .select('id, status')
    .eq('user_id', userId)
    .eq('curriculum_topic', quiz.topic_name)
    .eq('subject', quiz.subject)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single();

  const masteryUpdate = {
    status: isPerfect ? 'amber' : 'red',
    last_quiz_score: scorePercent,
    last_quiz_at: now.toISOString(),
    retention_check_due: retentionDue ? retentionDue.toISOString() : null,
    retention_check_passed: false,
    last_activity_at: now.toISOString(),
  };

  if (existing) {
    // Don't downgrade from green unless it's a retention check failure
    if (existing.status === 'green' && !isPerfect) {
      masteryUpdate.status = 'amber';
    }

    await supabaseAdmin
      .from('student_mastery')
      .update(masteryUpdate)
      .eq('id', existing.id);
  } else {
    // Create new mastery record
    await supabaseAdmin
      .from('student_mastery')
      .insert({
        user_id: userId,
        subject: quiz.subject,
        curriculum_topic: quiz.topic_name,
        specific_topic: quiz.topic_name,
        ...masteryUpdate,
      });
  }
}

/**
 * Called after a retention check quiz is completed.
 *
 * - ≥80% correct → status = 'green'
 * - <80%         → stay amber, reschedule retention check in 48h
 */
export async function processRetentionCheck(userId, masteryId, scorePercent) {
  const now = new Date();

  if (scorePercent >= 80) {
    await supabaseAdmin
      .from('student_mastery')
      .update({
        status: 'green',
        retention_check_passed: true,
        last_activity_at: now.toISOString(),
        last_quiz_score: scorePercent,
        last_quiz_at: now.toISOString(),
        retention_check_due: null,
      })
      .eq('id', masteryId);

    // Check for milestone certificate
    const { data: masteryRecord } = await supabaseAdmin
      .from('student_mastery')
      .select('subject')
      .eq('id', masteryId)
      .single();
    if (masteryRecord) {
      checkMilestoneCertificate(userId, masteryRecord.subject);
    }
  } else {
    // Failed — stay amber, reschedule
    const newDue = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    await supabaseAdmin
      .from('student_mastery')
      .update({
        status: 'amber',
        retention_check_passed: false,
        last_activity_at: now.toISOString(),
        last_quiz_score: scorePercent,
        last_quiz_at: now.toISOString(),
        retention_check_due: newDue.toISOString(),
      })
      .eq('id', masteryId);

    // Create refresher mission
    await supabaseAdmin
      .from('refresher_missions')
      .insert({
        user_id: userId,
        mastery_id: masteryId,
        trigger_reason: 'retention_check_failed',
        status: 'pending',
        due_at: newDue.toISOString(),
      });
  }
}

/**
 * Decay check — called by daily cron.
 *
 * GREEN topics with last_activity_at > 21 days ago → AMBER + refresher mission
 */
export async function checkDecay() {
  const cutoff = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();

  const { data: decayed, error } = await supabaseAdmin
    .from('student_mastery')
    .select('id, user_id, curriculum_topic, subject')
    .eq('status', 'green')
    .lt('last_activity_at', cutoff);

  if (error) {
    console.error('checkDecay: query error', error);
    return { decayedCount: 0 };
  }

  if (!decayed || decayed.length === 0) {
    return { decayedCount: 0 };
  }

  // Batch update to amber
  const ids = decayed.map(d => d.id);
  await supabaseAdmin
    .from('student_mastery')
    .update({
      status: 'amber',
      retention_check_passed: false,
      retention_check_due: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    .in('id', ids);

  // Create refresher missions
  const missions = decayed.map(d => ({
    user_id: d.user_id,
    mastery_id: d.id,
    trigger_reason: 'decay_21_days',
    status: 'pending',
    due_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  }));

  await supabaseAdmin
    .from('refresher_missions')
    .insert(missions);

  return { decayedCount: decayed.length };
}
