/**
 * LTI 1.3 OIDC Login Initiation Endpoint
 *
 * This is the first step in the LTI 1.3 launch flow.
 * The LMS (platform) sends a GET or POST request to this endpoint to initiate
 * the OIDC authentication flow.
 *
 * Flow:
 * 1. Platform sends login initiation request with iss, login_hint, etc.
 * 2. Tool validates the request and generates state/nonce
 * 3. Tool redirects to platform's OIDC authorization endpoint
 * 4. Platform authenticates user and redirects to /api/lti/launch with id_token
 *
 * @see https://www.imsglobal.org/spec/security/v1p0/#step-1-third-party-initiated-login
 */

import { NextResponse } from 'next/server';
import { getPlatformByIssuer, getPlatformByClientId, createOIDCState } from '@/lib/lti';

const TOOL_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/lti/launch`;

/**
 * Handle OIDC login initiation (GET request)
 */
export async function GET(req) {
  return handleLoginInitiation(req);
}

/**
 * Handle OIDC login initiation (POST request)
 */
export async function POST(req) {
  return handleLoginInitiation(req);
}

/**
 * Common handler for login initiation
 */
async function handleLoginInitiation(req) {
  try {
    // Extract parameters from query string or form body
    const { searchParams } = new URL(req.url);
    let params = Object.fromEntries(searchParams);

    // If POST, also check form body
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const body = await req.text();
        const formParams = new URLSearchParams(body);
        params = { ...params, ...Object.fromEntries(formParams) };
      }
    }

    // Required parameters
    const {
      iss,
      login_hint,
      target_link_uri,
      lti_message_hint,
      client_id,
      lti_deployment_id,
    } = params;

    // Validate required parameters
    if (!iss) {
      return NextResponse.json(
        { error: 'Missing required parameter: iss (issuer)' },
        { status: 400 }
      );
    }

    if (!login_hint) {
      return NextResponse.json(
        { error: 'Missing required parameter: login_hint' },
        { status: 400 }
      );
    }

    // Find the platform by issuer or client_id
    let platform = await getPlatformByIssuer(iss);

    if (!platform && client_id) {
      platform = await getPlatformByClientId(client_id);
    }

    if (!platform) {
      console.error(`Unknown platform: issuer=${iss}, client_id=${client_id}`);
      return NextResponse.json(
        {
          error: 'Unknown platform',
          message: 'This platform has not been registered with Newton. Please contact your administrator.',
          issuer: iss,
        },
        { status: 403 }
      );
    }

    // Verify client_id matches if provided
    if (client_id && platform.client_id !== client_id) {
      return NextResponse.json(
        { error: 'Client ID mismatch' },
        { status: 403 }
      );
    }

    // Verify deployment_id if provided and platform has one configured
    if (lti_deployment_id && platform.deployment_id && platform.deployment_id !== lti_deployment_id) {
      return NextResponse.json(
        { error: 'Deployment ID mismatch' },
        { status: 403 }
      );
    }

    // Create OIDC state (includes nonce for replay protection)
    const { state, nonce, encryptedState } = await createOIDCState({
      issuer: iss,
      clientId: platform.client_id,
      loginHint: login_hint,
      ltiMessageHint: lti_message_hint,
      targetLinkUri: target_link_uri,
    });

    // Build authorization URL
    const authParams = new URLSearchParams({
      response_type: 'id_token',
      response_mode: 'form_post',
      scope: 'openid',
      client_id: platform.client_id,
      redirect_uri: TOOL_REDIRECT_URI,
      login_hint: login_hint,
      state: state,
      nonce: nonce,
      prompt: 'none', // No additional prompts since user is already authenticated in LMS
    });

    // Add lti_message_hint if provided (required for some platforms)
    if (lti_message_hint) {
      authParams.set('lti_message_hint', lti_message_hint);
    }

    const authUrl = `${platform.oidc_auth_url}?${authParams.toString()}`;

    console.log(`LTI Login: Redirecting to ${platform.name} (${iss})`);

    // Redirect to platform's OIDC authorization endpoint
    return NextResponse.redirect(authUrl, { status: 302 });

  } catch (error) {
    console.error('LTI Login Error:', error);
    return NextResponse.json(
      {
        error: 'Login initiation failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
