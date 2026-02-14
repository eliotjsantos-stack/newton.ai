import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a notification email via Resend.
 * Records the result in the notifications table.
 */
export async function sendNotification({ to, subject, html, userId, notificationType, supabase }) {
  // Record in notifications table
  const { data: notification, error: insertError } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      recipient_email: to,
      notification_type: notificationType,
      subject_line: subject,
      body_html: html,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Failed to record notification:', insertError);
  }

  try {
    const result = await resend.emails.send({
      from: 'Newton AI <notifications@trynewtonai.com>',
      to,
      subject,
      html,
    });

    // Mark as sent
    if (notification) {
      await supabase
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notification.id);
    }

    return { success: true, result };
  } catch (err) {
    console.error('Email send error:', err);

    if (notification) {
      await supabase
        .from('notifications')
        .update({ status: 'failed' })
        .eq('id', notification.id);
    }

    return { success: false, error: err.message };
  }
}
