import { supabase, supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Validate password strength
function validatePassword(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}

export async function POST(req) {
  try {
    const { email, code, password, yearGroup, accountType = 'student', teacherCode, fullName, preferredTitle } = await req.json();

    const TEACHER_CODE = '2J9R-P3YX';

    // Validate inputs
    if (!email || !code || !password || (accountType === 'student' && !yearGroup)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate teacher code
    if (accountType === 'teacher') {
      const normalized = (teacherCode || '').toUpperCase().replace(/[\s-]/g, '');
      if (!teacherCode || normalized !== TEACHER_CODE.replace('-', '')) {
        return NextResponse.json(
          { error: 'Invalid teacher code' },
          { status: 400 }
        );
      }
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      );
    }

    // Find verification code
    const { data: verificationData, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .single();

    if (fetchError || !verificationData) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Check if code expired
    if (new Date(verificationData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        year_group: accountType === 'teacher' ? 'teacher' : yearGroup,
        is_verified: true,
        account_type: accountType,
        ...(accountType === 'teacher' && fullName ? { full_name: fullName } : {}),
        ...(accountType === 'teacher' && preferredTitle ? { preferred_title: preferredTitle } : {}),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: 'Failed to create account: ' + (createError.message || createError.code || JSON.stringify(createError)) },
        { status: 500 }
      );
    }

    // Enroll new students (not teachers) in the General subject
    if (accountType !== 'teacher') {
      await supabaseAdmin
        .from('student_subjects')
        .insert({ student_id: newUser.id, subject_id: '00000000-0000-0000-0000-000000000001' })
        .then(({ error }) => { if (error && error.code !== '23505') console.error('General enroll error:', error); });
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verificationData.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return user data and token
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        yearGroup: newUser.year_group,
        accountType: newUser.account_type || 'student'
      },
      token
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}