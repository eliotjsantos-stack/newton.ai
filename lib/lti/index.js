/**
 * LTI 1.3 Advantage Integration for Newton AI
 *
 * This module provides Learning Tools Interoperability (LTI) 1.3 support,
 * allowing Newton to be embedded in Learning Management Systems like:
 * - Canvas (by Instructure)
 * - Moodle
 * - Blackboard Learn
 * - D2L Brightspace
 * - Schoology
 *
 * NOTE: Google Classroom does NOT support LTI. Use the Google Classroom API instead.
 *
 * @see https://www.imsglobal.org/spec/lti/v1p3/
 */

// Types and constants
export {
  LTI_MESSAGE_TYPES,
  LTI_CLAIMS,
  LTI_ROLES,
  LTI_VERSION,
  isInstructor,
  isLearner,
  getSimpleRole,
} from './types';

// Platform management
export {
  getPlatformByIssuer,
  getPlatformByClientId,
  registerPlatform,
  getAllPlatforms,
  deletePlatform,
  clearPlatformCache,
} from './platform';

// JWT operations
export {
  verifyLTIToken,
  extractLaunchData,
  getToolKeyPair,
  getToolPublicJWK,
  getToolJWKS,
  generateServiceToken,
} from './jwt';

// State management
export {
  createOIDCState,
  verifyOIDCState,
  cleanupExpiredStates,
  generateLTISessionToken,
  verifyLTISessionToken,
} from './state';
