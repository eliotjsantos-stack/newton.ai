import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
} function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(req) {
  console.log('🚀 API CALLED - signup form is working');
  try {
    const { email } = await req.json();

   if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

   const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 400 }
      );
    }

  const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email.toLowerCase())
      .eq('used', false);

  const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Error storing verification code:', insertError);
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      );
    }

    // Send email with Resend
    try {
  console.log('=== EMAIL SENDING DEBUG ===');
  console.log('API Key exists:', !!process.env.RESEND_API_KEY);
  console.log('API Key value:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
  console.log('Sending to:', email);
  
  const result = await resend.emails.send({
    from: 'Newton AI <verify@trynewtonai.com>',
    to: email,
    subject: 'Your Newton AI Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Welcome to Newton AI!</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="font-size: 36px; letter-spacing: 8px; color: #000; margin: 0;">${code}</h1>
        </div>
        <p style="color: #4a4a4a; line-height: 1.6;">This code will expire in 10 minutes.</p>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `
  });
  
  console.log('Email send result:', result);
  console.log(`Verification code sent to ${email}: ${code}`);
} catch (emailError) {
  console.error('FAILED TO SEND EMAIL:', emailError);
  console.error('Error details:', emailError.message);
}

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      devCode: process.env.NODE_ENV === 'development' ? code : undefined
    });

  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}