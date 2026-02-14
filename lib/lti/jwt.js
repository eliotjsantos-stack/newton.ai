/**
 * LTI 1.3 JWT Handling
 *
 * Handles JWT verification for LTI launches and token generation for services.
 * Uses jose library for JWT operations (Web Crypto API compatible).
 */

import * as jose from 'jose';
import crypto from 'crypto';
import { LTI_CLAIMS, LTI_VERSION } from './types';

// Cache for platform JWKS (JSON Web Key Sets)
const jwksCache = new Map();
const JWKS_CACHE_TTL = 3600000; // 1 hour

/**
 * Fetch and cache platform's JWKS
 * @param {string} jwksUrl - Platform's JWKS URL
 * @returns {Promise<jose.JWKS>}
 */
async function fetchJWKS(jwksUrl) {
  const cached = jwksCache.get(jwksUrl);
  if (cached && Date.now() - cached.timestamp < JWKS_CACHE_TTL) {
    return cached.jwks;
  }

  try {
    const response = await fetch(jwksUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.status}`);
    }

    const jwksData = await response.json();
    const jwks = jose.createRemoteJWKSet(new URL(jwksUrl));

    jwksCache.set(jwksUrl, {
      jwks,
      timestamp: Date.now(),
    });

    return jwks;
  } catch (error) {
    console.error('Error fetching JWKS:', error);
    throw new Error(`Failed to fetch platform JWKS: ${error.message}`);
  }
}

/**
 * Verify an LTI launch JWT (id_token)
 * @param {string} idToken - The JWT id_token from the LTI launch
 * @param {Object} platform - Platform configuration
 * @param {string} expectedNonce - Expected nonce value (from state)
 * @returns {Promise<Object>} - Verified JWT payload
 */
export async function verifyLTIToken(idToken, platform, expectedNonce) {
  if (!idToken) {
    throw new Error('No id_token provided');
  }

  if (!platform || !platform.jwks_url) {
    throw new Error('Platform JWKS URL not configured');
  }

  try {
    // Create JWKS getter for the platform
    const jwks = jose.createRemoteJWKSet(new URL(platform.jwks_url));

    // Verify the JWT
    const { payload, protectedHeader } = await jose.jwtVerify(idToken, jwks, {
      issuer: platform.issuer,
      audience: platform.client_id,
      clockTolerance: 60, // 60 seconds tolerance for clock skew
    });

    // Verify nonce if provided
    if (expectedNonce && payload.nonce !== expectedNonce) {
      throw new Error('Nonce mismatch - possible replay attack');
    }

    // Verify LTI version
    const ltiVersion = payload[LTI_CLAIMS.VERSION];
    if (ltiVersion !== LTI_VERSION) {
      console.warn(`LTI version mismatch. Expected ${LTI_VERSION}, got ${ltiVersion}`);
    }

    // Verify deployment ID if platform has one configured
    if (platform.deployment_id) {
      const deploymentId = payload[LTI_CLAIMS.DEPLOYMENT_ID];
      if (deploymentId !== platform.deployment_id) {
        throw new Error('Deployment ID mismatch');
      }
    }

    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Extract LTI launch data from verified JWT payload
 * @param {Object} payload - Verified JWT payload
 * @returns {Object} - Normalized launch data
 */
export function extractLaunchData(payload) {
  return {
    // User information
    userId: payload.sub,
    email: payload.email || null,
    name: payload.name || null,
    givenName: payload.given_name || null,
    familyName: payload.family_name || null,
    picture: payload.picture || null,

    // LTI-specific claims
    messageType: payload[LTI_CLAIMS.MESSAGE_TYPE],
    version: payload[LTI_CLAIMS.VERSION],
    deploymentId: payload[LTI_CLAIMS.DEPLOYMENT_ID],
    targetLinkUri: payload[LTI_CLAIMS.TARGET_LINK_URI],

    // Roles
    roles: payload[LTI_CLAIMS.ROLES] || [],

    // Context (course/class)
    context: payload[LTI_CLAIMS.CONTEXT] || null,

    // Resource link
    resourceLink: payload[LTI_CLAIMS.RESOURCE_LINK] || null,

    // Platform info
    platform: payload[LTI_CLAIMS.TOOL_PLATFORM] || null,

    // Launch presentation
    launchPresentation: payload[LTI_CLAIMS.LAUNCH_PRESENTATION] || null,

    // Custom parameters
    custom: payload[LTI_CLAIMS.CUSTOM] || {},

    // LIS (Learning Information Services)
    lis: payload[LTI_CLAIMS.LIS] || null,

    // LTI Advantage services
    namesRoleService: payload[LTI_CLAIMS.NAMES_ROLE_SERVICE] || null,
    assignmentGradeService: payload[LTI_CLAIMS.ASSIGNMENT_GRADE_SERVICE] || null,
    deepLinkingSettings: payload[LTI_CLAIMS.DEEP_LINKING_SETTINGS] || null,

    // Raw payload for any additional claims
    raw: payload,
  };
}

// Tool's RSA key pair for signing JWTs (generated once, stored securely)
let toolKeyPair = null;
let toolPublicJWK = null;

/**
 * Get or generate the tool's RSA key pair
 * In production, load this from environment variables or a secrets manager
 * @returns {Promise<{privateKey: CryptoKey, publicKey: CryptoKey}>}
 */
export async function getToolKeyPair() {
  if (toolKeyPair) {
    return toolKeyPair;
  }

  // Check for environment variable keys
  const privateKeyPEM = process.env.LTI_PRIVATE_KEY;
  const publicKeyPEM = process.env.LTI_PUBLIC_KEY;

  if (privateKeyPEM && publicKeyPEM) {
    try {
      const privateKey = await jose.importPKCS8(
        privateKeyPEM.replace(/\\n/g, '\n'),
        'RS256'
      );
      const publicKey = await jose.importSPKI(
        publicKeyPEM.replace(/\\n/g, '\n'),
        'RS256'
      );

      toolKeyPair = { privateKey, publicKey };
      return toolKeyPair;
    } catch (error) {
      console.error('Error importing keys from environment:', error);
    }
  }

  // Generate a new key pair if none exists
  // WARNING: In production, persist these keys!
  console.warn('Generating new RSA key pair. Keys should be persisted in production!');

  const { publicKey, privateKey } = await jose.generateKeyPair('RS256', {
    modulusLength: 2048,
  });

  toolKeyPair = { privateKey, publicKey };
  return toolKeyPair;
}

/**
 * Get the tool's public key as JWK
 * @returns {Promise<Object>}
 */
export async function getToolPublicJWK() {
  if (toolPublicJWK) {
    return toolPublicJWK;
  }

  const { publicKey } = await getToolKeyPair();
  const jwk = await jose.exportJWK(publicKey);

  // Add key metadata
  jwk.kid = process.env.LTI_KEY_ID || 'newton-lti-key-1';
  jwk.alg = 'RS256';
  jwk.use = 'sig';

  toolPublicJWK = jwk;
  return toolPublicJWK;
}

/**
 * Get the tool's JWKS (JSON Web Key Set)
 * @returns {Promise<Object>}
 */
export async function getToolJWKS() {
  const publicJWK = await getToolPublicJWK();
  return {
    keys: [publicJWK],
  };
}

/**
 * Generate a signed JWT for LTI service requests
 * @param {Object} platform - Platform configuration
 * @param {Object} claims - Additional claims to include
 * @returns {Promise<string>} - Signed JWT
 */
export async function generateServiceToken(platform, claims = {}) {
  const { privateKey } = await getToolKeyPair();
  const publicJWK = await getToolPublicJWK();

  const jwt = await new jose.SignJWT({
    ...claims,
  })
    .setProtectedHeader({
      alg: 'RS256',
      kid: publicJWK.kid,
      typ: 'JWT',
    })
    .setIssuedAt()
    .setIssuer(process.env.NEXT_PUBLIC_APP_URL || 'https://newton.ai')
    .setSubject(platform.client_id)
    .setAudience(platform.token_url)
    .setExpirationTime('5m')
    .setJti(crypto.randomUUID())
    .sign(privateKey);

  return jwt;
}
