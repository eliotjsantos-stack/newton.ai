/**
 * LTI 1.3 JWKS (JSON Web Key Set) Endpoint
 *
 * Exposes the tool's public keys for platforms to verify our signatures.
 * Platforms fetch this endpoint during registration and when verifying
 * JWTs signed by the tool (e.g., deep linking responses, grade passback).
 *
 * @see https://www.imsglobal.org/spec/lti/v1p3/impl/#jwk-set-endpoint
 */

import { NextResponse } from 'next/server';
import { getToolJWKS } from '@/lib/lti';

/**
 * GET /.well-known/jwks.json or /api/lti/jwks
 *
 * Returns the tool's public keys in JWKS format
 */
export async function GET() {
  try {
    const jwks = await getToolJWKS();

    return NextResponse.json(jwks, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*', // Allow any platform to fetch
      },
    });
  } catch (error) {
    console.error('JWKS endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to generate JWKS' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
