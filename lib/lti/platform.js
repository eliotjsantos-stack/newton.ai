/**
 * LTI 1.3 Platform Registry
 *
 * Manages registered LMS platforms (Canvas, Moodle, Blackboard, etc.)
 * In production, store these in a database.
 */

import { supabase } from '@/lib/supabase';

/**
 * Pre-configured platforms (commonly used LMS)
 * These can be overridden by database entries
 */
const DEFAULT_PLATFORMS = {
  // Canvas by Instructure
  canvas: {
    name: 'Canvas',
    // Canvas uses institution-specific URLs, so these are templates
    // Actual values come from registration
    oidcAuthUrlTemplate: 'https://{domain}/api/lti/authorize_redirect',
    jwksUrlTemplate: 'https://{domain}/api/lti/security/jwks',
    tokenUrlTemplate: 'https://{domain}/login/oauth2/token',
  },

  // Moodle
  moodle: {
    name: 'Moodle',
    oidcAuthUrlTemplate: 'https://{domain}/mod/lti/auth.php',
    jwksUrlTemplate: 'https://{domain}/mod/lti/certs.php',
    tokenUrlTemplate: 'https://{domain}/mod/lti/token.php',
  },

  // Blackboard Learn
  blackboard: {
    name: 'Blackboard Learn',
    oidcAuthUrl: 'https://developer.blackboard.com/api/v1/gateway/oidcauth',
    jwksUrl: 'https://developer.blackboard.com/.well-known/jwks.json',
    tokenUrl: 'https://developer.blackboard.com/api/v1/gateway/oauth2/jwttoken',
  },

  // D2L Brightspace
  brightspace: {
    name: 'Brightspace',
    oidcAuthUrlTemplate: 'https://{domain}/d2l/lti/authenticate',
    jwksUrlTemplate: 'https://{domain}/d2l/.well-known/jwks',
    tokenUrlTemplate: 'https://{domain}/core/connect/token',
  },

  // Schoology
  schoology: {
    name: 'Schoology',
    oidcAuthUrl: 'https://lti-service.svc.schoology.com/lti-service/authorize-redirect',
    jwksUrl: 'https://lti-service.svc.schoology.com/lti-service/.well-known/jwks.json',
    tokenUrl: 'https://lti-service.svc.schoology.com/lti-service/access-token',
  },
};

/**
 * In-memory cache for platform configurations
 * In production, use Redis or similar
 */
const platformCache = new Map();

/**
 * Get platform configuration by issuer
 * @param {string} issuer - Platform's issuer identifier
 * @returns {Promise<Object|null>}
 */
export async function getPlatformByIssuer(issuer) {
  // Check cache first
  if (platformCache.has(issuer)) {
    return platformCache.get(issuer);
  }

  try {
    // Try to fetch from database
    const { data, error } = await supabase
      .from('lti_platforms')
      .select('*')
      .eq('issuer', issuer)
      .single();

    if (data && !error) {
      platformCache.set(issuer, data);
      return data;
    }
  } catch (e) {
    console.error('Error fetching platform from database:', e);
  }

  return null;
}

/**
 * Get platform configuration by client ID
 * @param {string} clientId - Client ID
 * @returns {Promise<Object|null>}
 */
export async function getPlatformByClientId(clientId) {
  try {
    const { data, error } = await supabase
      .from('lti_platforms')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (data && !error) {
      platformCache.set(data.issuer, data);
      return data;
    }
  } catch (e) {
    console.error('Error fetching platform by client ID:', e);
  }

  return null;
}

/**
 * Register a new platform
 * @param {Object} config - Platform configuration
 * @returns {Promise<Object>}
 */
export async function registerPlatform(config) {
  const {
    issuer,
    clientId,
    deploymentId,
    oidcAuthUrl,
    jwksUrl,
    tokenUrl,
    name,
  } = config;

  const { data, error } = await supabase
    .from('lti_platforms')
    .upsert({
      issuer,
      client_id: clientId,
      deployment_id: deploymentId,
      oidc_auth_url: oidcAuthUrl,
      jwks_url: jwksUrl,
      token_url: tokenUrl,
      name: name || 'Unknown Platform',
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'issuer,client_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to register platform: ${error.message}`);
  }

  // Update cache
  platformCache.set(issuer, data);

  return data;
}

/**
 * Get all registered platforms
 * @returns {Promise<Array>}
 */
export async function getAllPlatforms() {
  const { data, error } = await supabase
    .from('lti_platforms')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching platforms:', error);
    return [];
  }

  return data || [];
}

/**
 * Delete a platform registration
 * @param {string} issuer - Platform issuer
 * @param {string} clientId - Client ID
 * @returns {Promise<boolean>}
 */
export async function deletePlatform(issuer, clientId) {
  const { error } = await supabase
    .from('lti_platforms')
    .delete()
    .eq('issuer', issuer)
    .eq('client_id', clientId);

  if (error) {
    console.error('Error deleting platform:', error);
    return false;
  }

  platformCache.delete(issuer);
  return true;
}

/**
 * Clear the platform cache
 */
export function clearPlatformCache() {
  platformCache.clear();
}
