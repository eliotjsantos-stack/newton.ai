/**
 * LTI 1.3 State Management
 *
 * Handles state and nonce management for the OIDC authentication flow.
 * State protects against CSRF attacks.
 * Nonce protects against replay attacks.
 *
 * For iframe deployments where third-party cookies may be blocked,
 * we use encrypted state tokens instead of cookies.
 */

import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

// State token expiration (5 minutes)
const STATE_TTL = 5 * 60 * 1000;

// Secret for encrypting state tokens (must be set in production)
const STATE_SECRET = process.env.LTI_STATE_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Desired length
 * @returns {string}
 */
function generateRandomString(length = 32) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

/**
 * Encrypt data for state token
 * @param {Object} data - Data to encrypt
 * @returns {string}
 */
function encryptState(data) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(STATE_SECRET, 'lti-state-salt', 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const jsonData = JSON.stringify(data);
  let encrypted = cipher.update(jsonData, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine IV + authTag + encrypted data
  return Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'base64')
  ]).toString('base64url');
}

/**
 * Decrypt state token
 * @param {string} token - Encrypted state token
 * @returns {Object|null}
 */
function decryptState(token) {
  try {
    const buffer = Buffer.from(token, 'base64url');

    const iv = buffer.subarray(0, 16);
    const authTag = buffer.subarray(16, 32);
    const encrypted = buffer.subarray(32);

    const key = crypto.scryptSync(STATE_SECRET, 'lti-state-salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    console.error('Failed to decrypt state:', error);
    return null;
  }
}

/**
 * Create a new OIDC state for LTI login
 * @param {Object} params - State parameters
 * @param {string} params.issuer - Platform issuer
 * @param {string} params.clientId - Client ID
 * @param {string} params.loginHint - Login hint from platform
 * @param {string} params.ltiMessageHint - LTI message hint from platform
 * @param {string} params.targetLinkUri - Target URI for the launch
 * @returns {Promise<{state: string, nonce: string}>}
 */
export async function createOIDCState(params) {
  const state = generateRandomString(32);
  const nonce = generateRandomString(32);
  const createdAt = Date.now();

  const stateData = {
    state,
    nonce,
    issuer: params.issuer,
    clientId: params.clientId,
    loginHint: params.loginHint,
    ltiMessageHint: params.ltiMessageHint,
    targetLinkUri: params.targetLinkUri,
    createdAt,
    expiresAt: createdAt + STATE_TTL,
  };

  // Store in database for verification
  const { error } = await supabase
    .from('lti_state')
    .insert({
      state,
      nonce,
      issuer: params.issuer,
      client_id: params.clientId,
      data: stateData,
      created_at: new Date(createdAt).toISOString(),
      expires_at: new Date(createdAt + STATE_TTL).toISOString(),
    });

  if (error) {
    console.error('Failed to store OIDC state:', error);
    // Fall back to encrypted token (cookieless mode)
  }

  // Also create encrypted state token as backup (for cookieless scenarios)
  const encryptedState = encryptState(stateData);

  return {
    state,
    nonce,
    encryptedState, // Can be passed as state parameter for cookieless flow
  };
}

/**
 * Verify OIDC state from LTI launch
 * @param {string} state - State parameter from launch
 * @returns {Promise<Object|null>} - State data if valid, null otherwise
 */
export async function verifyOIDCState(state) {
  // First try database lookup
  try {
    const { data, error } = await supabase
      .from('lti_state')
      .select('*')
      .eq('state', state)
      .single();

    if (data && !error) {
      // Check expiration
      if (new Date(data.expires_at) < new Date()) {
        console.warn('State token expired');
        // Clean up expired state
        await supabase.from('lti_state').delete().eq('state', state);
        return null;
      }

      // Delete used state (one-time use)
      await supabase.from('lti_state').delete().eq('state', state);

      return data.data;
    }
  } catch (e) {
    console.error('Error verifying state from database:', e);
  }

  // Try decrypting as encrypted state token (cookieless fallback)
  const decrypted = decryptState(state);
  if (decrypted) {
    // Check expiration
    if (decrypted.expiresAt < Date.now()) {
      console.warn('Encrypted state token expired');
      return null;
    }
    return decrypted;
  }

  return null;
}

/**
 * Clean up expired states (run periodically)
 */
export async function cleanupExpiredStates() {
  const { error } = await supabase
    .from('lti_state')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to cleanup expired states:', error);
  }
}

/**
 * Generate a session token for authenticated LTI user
 * @param {Object} launchData - LTI launch data
 * @param {Object} platform - Platform configuration
 * @returns {string}
 */
export function generateLTISessionToken(launchData, platform) {
  const sessionData = {
    userId: launchData.userId,
    email: launchData.email,
    name: launchData.name,
    roles: launchData.roles,
    contextId: launchData.context?.id,
    contextTitle: launchData.context?.title,
    platformId: platform.issuer,
    platformName: platform.name,
    deploymentId: launchData.deploymentId,
    resourceLinkId: launchData.resourceLink?.id,
    createdAt: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  };

  return encryptState(sessionData);
}

/**
 * Verify LTI session token
 * @param {string} token - Session token
 * @returns {Object|null}
 */
export function verifyLTISessionToken(token) {
  const data = decryptState(token);
  if (!data) return null;

  if (data.expiresAt < Date.now()) {
    return null;
  }

  return data;
}
