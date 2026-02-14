import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { sendNotification } from '@/lib/email';
import { milestoneCertificateTemplate } from '@/lib/emailTemplates';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { studentId, milestone, subject } = await req.json();

    if (!studentId || !milestone) {
      return NextResponse.json({ error: 'studentId and milestone are required' }, { status: 400 });
    }

    // Get student info
    const { data: student } = await supabaseAdmin
      .from('users')
      .select('name, email, parent_email')
      .eq('id', studentId)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const recipientEmail = student.parent_email || student.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: 'No email address available' }, { status: 400 });
    }

    const template = milestoneCertificateTemplate({
      studentName: student.name || 'Student',
      parentName: null,
      milestone,
      subject: subject || 'General',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    });

    await sendNotification({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      userId: studentId,
      notificationType: 'milestone_certificate',
      supabase: supabaseAdmin,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Send certificate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
