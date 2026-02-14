import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';
import { sendNotification } from '@/lib/email';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * POST /api/teacher/notify-parent
 *
 * Teacher-triggered immediate parent notification.
 * Body: { studentId, subject, message }
 */
export async function POST(req) {
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

    // Verify teacher role
    const { data: teacher } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single();

    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
    }

    const { studentId, subject, message } = await req.json();

    if (!studentId || !message) {
      return NextResponse.json({ error: 'studentId and message are required' }, { status: 400 });
    }

    // Fetch student and parent info
    const { data: student } = await supabaseAdmin
      .from('users')
      .select('id, full_name, parent_email, parent_name, notifications_enabled')
      .eq('id', studentId)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!student.parent_email) {
      return NextResponse.json({ error: 'No parent email on file for this student' }, { status: 400 });
    }

    if (!student.notifications_enabled) {
      return NextResponse.json({ error: 'Notifications are disabled for this student' }, { status: 400 });
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: #000000; padding: 24px 32px;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 600;">Newton AI</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Dear ${student.parent_name || 'Parent/Guardian'},
          </p>
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            ${student.full_name || 'Your child'}&rsquo;s teacher has sent the following message${subject ? ` regarding <strong>${subject}</strong>` : ''}:
          </p>
          <div style="background: #f9fafb; border-left: 4px solid #0071e3; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
            <p style="color: #333; font-size: 14px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            If you have questions, please contact the school directly.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px;" />
          <p style="color: #999; font-size: 12px; line-height: 1.5;">
            This email was sent by Newton AI on behalf of your child&rsquo;s school.
          </p>
        </div>
      </div>
    `;

    const result = await sendNotification({
      to: student.parent_email,
      subject: `Newton AI — Message from ${student.full_name || 'your child'}'s teacher`,
      html,
      userId: studentId,
      notificationType: 'teacher_message',
      supabase: supabaseAdmin,
    });

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Notify parent error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
