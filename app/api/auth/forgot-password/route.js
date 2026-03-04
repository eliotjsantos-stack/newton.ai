import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const normalised = email.toLowerCase();

    // Look up user — always return success to avoid email enumeration
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', normalised)
      .single();

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Invalidate any existing reset tokens for this user
      await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('user_id', user.id);

      await supabaseAdmin
        .from('password_reset_tokens')
        .insert({ user_id: user.id, token, expires_at: expiresAt.toISOString() });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://trynewtonai.com'}/reset-password?token=${token}`;

      await resend.emails.send({
        from: 'Newton AI <verify@trynewtonai.com>',
        to: normalised,
        subject: 'Reset your Newton password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Reset your password</h2>
            <p style="color: #4a4a4a; line-height: 1.6;">We received a request to reset the password for your Newton account.</p>
            <p style="color: #4a4a4a; line-height: 1.6;">Click the button below to set a new password. This link expires in 1 hour.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="background: #0071e3; color: #fff; padding: 14px 32px; border-radius: 24px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Reset Password
              </a>
            </div>
            <p style="color: #999; font-size: 13px; margin-top: 32px;">If you didn&apos;t request this, you can safely ignore this email. Your password won&apos;t change.</p>
          </div>
        `,
      });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
