/**
 * LTI 1.3 Type Definitions and Constants
 *
 * Learning Tools Interoperability (LTI) 1.3 Advantage
 * Based on IMS Global specifications
 */

// LTI Message Types
export const LTI_MESSAGE_TYPES = {
  RESOURCE_LINK: 'LtiResourceLinkRequest',
  DEEP_LINKING: 'LtiDeepLinkingRequest',
  SUBMISSION_REVIEW: 'LtiSubmissionReviewRequest',
};

// LTI Claim URIs (IMS Global namespaced claims)
export const LTI_CLAIMS = {
  MESSAGE_TYPE: 'https://purl.imsglobal.org/spec/lti/claim/message_type',
  VERSION: 'https://purl.imsglobal.org/spec/lti/claim/version',
  DEPLOYMENT_ID: 'https://purl.imsglobal.org/spec/lti/claim/deployment_id',
  TARGET_LINK_URI: 'https://purl.imsglobal.org/spec/lti/claim/target_link_uri',
  RESOURCE_LINK: 'https://purl.imsglobal.org/spec/lti/claim/resource_link',
  ROLES: 'https://purl.imsglobal.org/spec/lti/claim/roles',
  CONTEXT: 'https://purl.imsglobal.org/spec/lti/claim/context',
  TOOL_PLATFORM: 'https://purl.imsglobal.org/spec/lti/claim/tool_platform',
  LAUNCH_PRESENTATION: 'https://purl.imsglobal.org/spec/lti/claim/launch_presentation',
  CUSTOM: 'https://purl.imsglobal.org/spec/lti/claim/custom',
  LIS: 'https://purl.imsglobal.org/spec/lti/claim/lis',

  // LTI Advantage Services
  NAMES_ROLE_SERVICE: 'https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice',
  ASSIGNMENT_GRADE_SERVICE: 'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint',
  DEEP_LINKING_SETTINGS: 'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings',
};

// LTI Role URIs
export const LTI_ROLES = {
  // System roles
  ADMINISTRATOR: 'http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator',

  // Institution roles
  INSTRUCTOR: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor',
  STUDENT: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student',
  STAFF: 'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Staff',

  // Context roles (course-level)
  CONTEXT_INSTRUCTOR: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
  CONTEXT_LEARNER: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
  CONTEXT_MENTOR: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor',
  CONTEXT_CONTENT_DEVELOPER: 'http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper',
  CONTEXT_ADMIN: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator',
  CONTEXT_TA: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor#TeachingAssistant',
};

// LTI Version
export const LTI_VERSION = '1.3.0';

/**
 * @typedef {Object} LTIPlatformConfig
 * @property {string} issuer - Platform's issuer identifier (iss claim)
 * @property {string} clientId - Client ID assigned to this tool
 * @property {string} deploymentId - Deployment ID for this tool instance
 * @property {string} oidcAuthUrl - Platform's OIDC authorization endpoint
 * @property {string} jwksUrl - Platform's JSON Web Key Set URL
 * @property {string} tokenUrl - Platform's access token endpoint (for services)
 * @property {string} name - Friendly name for the platform
 */

/**
 * @typedef {Object} LTILaunchData
 * @property {string} userId - LTI user ID (sub claim)
 * @property {string} email - User's email
 * @property {string} name - User's display name
 * @property {string} givenName - User's first name
 * @property {string} familyName - User's last name
 * @property {string[]} roles - User's LTI roles
 * @property {Object} context - Course/class context
 * @property {Object} resourceLink - Resource link information
 * @property {Object} platform - Platform information
 * @property {Object} custom - Custom parameters
 * @property {string} deploymentId - Deployment identifier
 * @property {string} targetLinkUri - Target URL for the launch
 */

/**
 * Check if user has instructor/teacher role
 * @param {string[]} roles - Array of LTI role URIs
 * @returns {boolean}
 */
export function isInstructor(roles) {
  const instructorRoles = [
    LTI_ROLES.INSTRUCTOR,
    LTI_ROLES.CONTEXT_INSTRUCTOR,
    LTI_ROLES.ADMINISTRATOR,
    LTI_ROLES.CONTEXT_ADMIN,
    LTI_ROLES.CONTEXT_TA,
  ];
  return roles.some(role => instructorRoles.some(ir => role.includes(ir) || role.includes('Instructor')));
}

/**
 * Check if user has learner/student role
 * @param {string[]} roles - Array of LTI role URIs
 * @returns {boolean}
 */
export function isLearner(roles) {
  return roles.some(role => role.includes('Learner') || role.includes('Student'));
}

/**
 * Extract a simple role from LTI roles array
 * @param {string[]} roles - Array of LTI role URIs
 * @returns {'teacher' | 'student' | 'admin' | 'unknown'}
 */
export function getSimpleRole(roles) {
  if (roles.some(r => r.includes('Administrator'))) return 'admin';
  if (isInstructor(roles)) return 'teacher';
  if (isLearner(roles)) return 'student';
  return 'unknown';
}
