/**
 * LTI 1.3 Launch Endpoint
 *
 * This endpoint receives the authenticated launch request from the LMS.
 * After OIDC authentication, the platform redirects here with an id_token (JWT).
 *
 * Flow:
 * 1. Receive POST with id_token and state from platform
 * 2. Verify state matches what we stored (CSRF protection)
 * 3. Verify JWT signature using platform's public keys (JWKS)
 * 4. Verify nonce to prevent replay attacks
 * 5. Extract user and context information
 * 6. Create/update user in Newton and redirect to appropriate page
 *
 * @see https://www.imsglobal.org/spec/security/v1p0/#step-3-authentication-response
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getPlatformByIssuer,
  verifyOIDCState,
  verifyLTIToken,
  extractLaunchData,
  generateLTISessionToken,
  getSimpleRole,
  LTI_MESSAGE_TYPES,
} from '@/lib/lti';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Handle LTI launch (POST - form_post response mode)
 */
export async function POST(req) {
  try {
    // Parse form data
    const contentType = req.headers.get('content-type') || '';
    let params = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = await req.text();
      params = Object.fromEntries(new URLSearchParams(body));
    } else if (contentType.includes('application/json')) {
      params = await req.json();
    }

    const { id_token, state, error: oauthError, error_description } = params;

    // Check for OAuth errors
    if (oauthError) {
      console.error('OAuth error from platform:', oauthError, error_description);
      return createErrorPage('Authentication Failed', error_description || oauthError);
    }

    // Validate required parameters
    if (!id_token) {
      return createErrorPage('Missing Token', 'No id_token received from the learning platform.');
    }

    if (!state) {
      return createErrorPage('Missing State', 'No state parameter received. This may be a security issue.');
    }

    // Verify state (CSRF protection)
    const stateData = await verifyOIDCState(state);
    if (!stateData) {
      return createErrorPage(
        'Invalid State',
        'The authentication state is invalid or expired. Please try launching again from your LMS.'
      );
    }

    // Get platform configuration
    const platform = await getPlatformByIssuer(stateData.issuer);
    if (!platform) {
      return createErrorPage(
        'Unknown Platform',
        'The learning platform is not registered with Newton.'
      );
    }

    // Verify JWT and extract payload
    let payload;
    try {
      payload = await verifyLTIToken(id_token, platform, stateData.nonce);
    } catch (error) {
      console.error('Token verification failed:', error);
      return createErrorPage(
        'Token Verification Failed',
        `Could not verify the authentication token: ${error.message}`
      );
    }

    // Extract launch data
    const launchData = extractLaunchData(payload);

    console.log('LTI Launch:', {
      messageType: launchData.messageType,
      user: launchData.email || launchData.userId,
      context: launchData.context?.title,
      roles: launchData.roles.length,
    });

    // Handle different message types
    switch (launchData.messageType) {
      case LTI_MESSAGE_TYPES.DEEP_LINKING:
        return handleDeepLinking(launchData, platform);

      case LTI_MESSAGE_TYPES.RESOURCE_LINK:
      default:
        return handleResourceLinkLaunch(launchData, platform);
    }

  } catch (error) {
    console.error('LTI Launch Error:', error);
    return createErrorPage(
      'Launch Failed',
      'An unexpected error occurred during launch. Please try again.'
    );
  }
}

/**
 * Handle standard resource link launch
 */
async function handleResourceLinkLaunch(launchData, platform) {
  // Determine user role
  const role = getSimpleRole(launchData.roles);

  // Find or create user in Newton
  const user = await findOrCreateLTIUser(launchData, platform);

  if (!user) {
    return createErrorPage(
      'User Creation Failed',
      'Could not create or find your user account.'
    );
  }

  // Generate Newton auth token
  const authToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      accountType: user.account_type,
      isAdmin: user.is_admin,
      ltiLaunch: true,
      platformId: platform.issuer,
      contextId: launchData.context?.id,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Generate LTI session token for additional context
  const ltiSession = generateLTISessionToken(launchData, platform);

  // Determine redirect destination based on role and context
  let redirectPath = '/chat';

  if (role === 'teacher') {
    // Check if there's a linked class
    const classId = await findOrCreateClassFromContext(launchData, platform, user.id);
    if (classId) {
      redirectPath = `/teacher/class/${classId}`;
    } else {
      redirectPath = '/teacher/classes';
    }
  } else if (launchData.context?.id) {
    // Student - link to chat with class context
    const classId = await findClassFromContext(launchData, platform);
    if (classId) {
      redirectPath = `/chat?classId=${classId}`;
    }
  }

  // Create redirect response with auth cookies
  const redirectUrl = new URL(redirectPath, APP_URL);

  const response = NextResponse.redirect(redirectUrl, { status: 302 });

  // Set authentication cookies
  const cookieStore = await cookies();

  // Main auth token
  response.cookies.set('newton-auth-token', authToken, {
    httpOnly: false, // Client needs to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none', // Required for iframe embedding
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });

  // LTI session context
  response.cookies.set('newton-lti-session', ltiSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 24 * 60 * 60,
    path: '/',
  });

  return response;
}

/**
 * Handle deep linking request
 * (When instructor is selecting content to embed in LMS)
 */
async function handleDeepLinking(launchData, platform) {
  // Store deep linking settings for later response
  const deepLinkSettings = launchData.deepLinkingSettings;

  // Redirect to content selection page
  const redirectUrl = new URL('/lti/select-content', APP_URL);
  redirectUrl.searchParams.set('settings', JSON.stringify(deepLinkSettings));

  return NextResponse.redirect(redirectUrl, { status: 302 });
}

/**
 * Find or create a Newton user from LTI data
 */
async function findOrCreateLTIUser(launchData, platform) {
  const email = launchData.email || `${launchData.userId}@${new URL(platform.issuer).hostname}`;
  const role = getSimpleRole(launchData.roles);

  // Try to find existing user by email
  let { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (user) {
    // Update LTI link if not already linked
    if (!user.lti_user_id) {
      await supabase
        .from('users')
        .update({
          lti_user_id: launchData.userId,
          lti_platform_id: platform.issuer,
          name: launchData.name || user.name,
        })
        .eq('id', user.id);
    }

    return user;
  }

  // Create new user
  const accountType = role === 'teacher' ? 'teacher' : 'student';

  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      email,
      email_verified: true, // Trust LMS verification
      name: launchData.name || email.split('@')[0],
      account_type: accountType,
      is_admin: false,
      lti_user_id: launchData.userId,
      lti_platform_id: platform.issuer,
      year_group: launchData.custom?.year_group || 'year10', // Default year group
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    console.error('Failed to create LTI user:', createError);
    return null;
  }

  return newUser;
}

/**
 * Find a Newton class from LTI context
 */
async function findClassFromContext(launchData, platform) {
  if (!launchData.context?.id) return null;

  const { data } = await supabase
    .from('classes')
    .select('id')
    .eq('lti_context_id', launchData.context.id)
    .eq('lti_platform_id', platform.issuer)
    .single();

  return data?.id || null;
}

/**
 * Find or create a Newton class from LTI context (for teachers)
 */
async function findOrCreateClassFromContext(launchData, platform, teacherId) {
  if (!launchData.context?.id) return null;

  // Try to find existing class
  let { data: cls } = await supabase
    .from('classes')
    .select('id')
    .eq('lti_context_id', launchData.context.id)
    .eq('lti_platform_id', platform.issuer)
    .single();

  if (cls) return cls.id;

  // Create new class linked to LTI context
  const { data: newClass, error } = await supabase
    .from('classes')
    .insert({
      name: launchData.context.title || 'LTI Class',
      subject: launchData.custom?.subject || 'General',
      teacher_id: teacherId,
      class_code: generateClassCode(),
      lti_context_id: launchData.context.id,
      lti_platform_id: platform.issuer,
      lti_resource_link_id: launchData.resourceLink?.id,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create LTI class:', error);
    return null;
  }

  return newClass?.id;
}

/**
 * Generate a random class code
 */
function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create an error page response
 */
function createErrorPage(title, message) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - Newton AI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .error-card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .icon {
      width: 80px;
      height: 80px;
      background: #fee2e2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: #dc2626;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 12px;
    }
    p {
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="error-card">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="javascript:window.close()" class="btn">Close Window</a>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    status: 400,
    headers: { 'Content-Type': 'text/html' },
  });
}
