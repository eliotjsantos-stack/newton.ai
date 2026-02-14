/**
 * LTI 1.3 Tool Configuration Endpoint
 *
 * Provides tool configuration information for LMS administrators
 * setting up Newton as an external tool.
 *
 * Also supports dynamic registration (LTI 1.3 Dynamic Registration spec).
 */

import { NextResponse } from 'next/server';
import { registerPlatform, getAllPlatforms } from '@/lib/lti';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const APP_NAME = 'Newton AI';
const APP_DESCRIPTION = 'AI-powered educational assistant for UK secondary school students. Newton uses the Socratic method to guide students through learning without solving their homework.';

/**
 * GET /api/lti/config
 *
 * Returns tool configuration for manual LTI setup
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'json';

  const config = {
    // Tool identification
    title: APP_NAME,
    description: APP_DESCRIPTION,
    icon_url: `${APP_URL}/icon-192.png`,

    // LTI 1.3 endpoints
    oidc_initiation_url: `${APP_URL}/api/lti/login`,
    target_link_uri: `${APP_URL}/api/lti/launch`,
    redirect_uris: [
      `${APP_URL}/api/lti/launch`,
    ],
    jwks_uri: `${APP_URL}/api/lti/jwks`,

    // Tool capabilities
    lti_version: '1.3.0',
    messages: [
      {
        type: 'LtiResourceLinkRequest',
        target_link_uri: `${APP_URL}/api/lti/launch`,
        label: 'Newton AI Tutor',
        icon_uri: `${APP_URL}/icon-48.png`,
      },
      {
        type: 'LtiDeepLinkingRequest',
        target_link_uri: `${APP_URL}/api/lti/launch`,
        label: 'Add Newton Content',
      },
    ],

    // Claims requested
    claims: [
      'iss',
      'sub',
      'name',
      'given_name',
      'family_name',
      'email',
      'picture',
    ],

    // Scopes for LTI Advantage services
    scopes: [
      'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
      'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly',
      'https://purl.imsglobal.org/spec/lti-ags/scope/score',
      'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
    ],

    // Custom parameters that can be configured
    custom_parameters: {
      year_group: '$Context.sourcedId',
      subject: '$ResourceLink.title',
    },

    // Privacy settings
    privacy: {
      personal_data_collected: ['name', 'email'],
      data_retention: '12 months',
      gdpr_compliant: true,
    },

    // Support information
    support: {
      email: 'support@newton.ai',
      documentation: `${APP_URL}/docs/lti`,
    },
  };

  // Return as Canvas XML format if requested
  if (format === 'xml' || format === 'canvas') {
    return generateCanvasXML(config);
  }

  return NextResponse.json(config, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * POST /api/lti/config
 *
 * Register a new platform (admin only)
 */
export async function POST(req) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // In production, verify the token is from an admin user
    // For now, check for a simple API key
    const apiKey = authHeader.substring(7);
    if (apiKey !== process.env.LTI_ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      issuer,
      clientId,
      deploymentId,
      oidcAuthUrl,
      jwksUrl,
      tokenUrl,
      name,
    } = body;

    // Validate required fields
    if (!issuer || !clientId || !oidcAuthUrl || !jwksUrl) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['issuer', 'clientId', 'oidcAuthUrl', 'jwksUrl'],
        },
        { status: 400 }
      );
    }

    const platform = await registerPlatform({
      issuer,
      clientId,
      deploymentId,
      oidcAuthUrl,
      jwksUrl,
      tokenUrl,
      name,
    });

    return NextResponse.json({
      success: true,
      platform,
      message: 'Platform registered successfully',
    });

  } catch (error) {
    console.error('Platform registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate Canvas-compatible XML configuration
 */
function generateCanvasXML(config) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0"
    xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0"
    xmlns:lticm="http://www.imsglobal.org/xsd/imslticm_v1p0"
    xmlns:lticp="http://www.imsglobal.org/xsd/imslticp_v1p0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imslticc_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd
    http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd
    http://www.imsglobal.org/xsd/imslticm_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd
    http://www.imsglobal.org/xsd/imslticp_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd">

  <blti:title>${config.title}</blti:title>
  <blti:description>${config.description}</blti:description>
  <blti:icon>${config.icon_url}</blti:icon>
  <blti:launch_url>${config.target_link_uri}</blti:launch_url>

  <blti:extensions platform="canvas.instructure.com">
    <lticm:property name="tool_id">newton_ai</lticm:property>
    <lticm:property name="privacy_level">public</lticm:property>
    <lticm:property name="domain">${new URL(APP_URL).hostname}</lticm:property>

    <lticm:options name="course_navigation">
      <lticm:property name="url">${config.target_link_uri}</lticm:property>
      <lticm:property name="text">Newton AI Tutor</lticm:property>
      <lticm:property name="visibility">public</lticm:property>
      <lticm:property name="default">enabled</lticm:property>
      <lticm:property name="enabled">true</lticm:property>
    </lticm:options>

    <lticm:options name="editor_button">
      <lticm:property name="url">${config.target_link_uri}</lticm:property>
      <lticm:property name="icon_url">${config.icon_url}</lticm:property>
      <lticm:property name="text">Newton AI</lticm:property>
      <lticm:property name="selection_width">800</lticm:property>
      <lticm:property name="selection_height">600</lticm:property>
      <lticm:property name="enabled">true</lticm:property>
    </lticm:options>
  </blti:extensions>

  <cartridge_bundle identifierref="BLTI001_Bundle"/>
  <cartridge_icon identifierref="BLTI001_Icon"/>
</cartridge_basiclti_link>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Content-Disposition': 'attachment; filename="newton-lti-config.xml"',
    },
  });
}
