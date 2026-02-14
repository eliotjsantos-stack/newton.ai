-- Migration: LTI 1.3 Tables
-- Creates tables for LTI platform registration and state management

-- LTI Platforms (registered LMS instances)
CREATE TABLE IF NOT EXISTS lti_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issuer VARCHAR(500) NOT NULL,           -- Platform's issuer identifier
    client_id VARCHAR(255) NOT NULL,        -- Client ID assigned to Newton
    deployment_id VARCHAR(255),             -- Optional deployment ID
    name VARCHAR(255) NOT NULL,             -- Friendly name (e.g., "University of X Canvas")
    oidc_auth_url VARCHAR(500) NOT NULL,    -- OIDC authorization endpoint
    jwks_url VARCHAR(500) NOT NULL,         -- Platform's JWKS endpoint
    token_url VARCHAR(500),                 -- Token endpoint for services
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique combination of issuer and client_id
    UNIQUE(issuer, client_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_lti_platforms_issuer ON lti_platforms(issuer);
CREATE INDEX IF NOT EXISTS idx_lti_platforms_client_id ON lti_platforms(client_id);

-- LTI State (for OIDC authentication flow)
CREATE TABLE IF NOT EXISTS lti_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(255) NOT NULL UNIQUE,     -- CSRF protection token
    nonce VARCHAR(255) NOT NULL,            -- Replay attack prevention
    issuer VARCHAR(500) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,                    -- Full state data (login_hint, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Index for quick state lookups
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Index for state verification
CREATE INDEX IF NOT EXISTS idx_lti_state_state ON lti_state(state);
CREATE INDEX IF NOT EXISTS idx_lti_state_expires ON lti_state(expires_at);

-- Add LTI fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS lti_user_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS lti_platform_id VARCHAR(500);

-- Index for LTI user lookups
CREATE INDEX IF NOT EXISTS idx_users_lti ON users(lti_user_id, lti_platform_id);

-- Add LTI fields to classes table
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS lti_context_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS lti_platform_id VARCHAR(500),
ADD COLUMN IF NOT EXISTS lti_resource_link_id VARCHAR(255);

-- Index for LTI context lookups
CREATE INDEX IF NOT EXISTS idx_classes_lti ON classes(lti_context_id, lti_platform_id);

-- LTI Nonces (for replay attack prevention - stores used nonces)
CREATE TABLE IF NOT EXISTS lti_nonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nonce VARCHAR(255) NOT NULL,
    platform_id UUID NOT NULL REFERENCES lti_platforms(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Ensure unique nonce per platform
    UNIQUE(nonce, platform_id)
);

-- Index for nonce verification
CREATE INDEX IF NOT EXISTS idx_lti_nonces_lookup ON lti_nonces(nonce, platform_id);
CREATE INDEX IF NOT EXISTS idx_lti_nonces_expires ON lti_nonces(expires_at);

-- LTI Deep Linking Items (content items created via deep linking)
CREATE TABLE IF NOT EXISTS lti_deep_link_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id UUID NOT NULL REFERENCES lti_platforms(id) ON DELETE CASCADE,
    context_id VARCHAR(255),
    resource_link_id VARCHAR(255),
    item_type VARCHAR(50) NOT NULL,          -- 'chat', 'quiz', 'topic', etc.
    item_id UUID,                            -- Reference to the actual item
    title VARCHAR(255) NOT NULL,
    custom_params JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lti_deep_link_platform ON lti_deep_link_items(platform_id, context_id);

-- Function to clean up expired states and nonces
CREATE OR REPLACE FUNCTION cleanup_expired_lti_data()
RETURNS void AS $$
BEGIN
    -- Delete expired states
    DELETE FROM lti_state WHERE expires_at < NOW();

    -- Delete expired nonces
    DELETE FROM lti_nonces WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE lti_platforms IS 'Registered LMS platforms for LTI 1.3 integration';
COMMENT ON TABLE lti_state IS 'Temporary state storage for OIDC authentication flow';
COMMENT ON TABLE lti_nonces IS 'Used nonces to prevent replay attacks';
COMMENT ON TABLE lti_deep_link_items IS 'Content items created via LTI Deep Linking';
COMMENT ON COLUMN users.lti_user_id IS 'LTI user identifier from the platform';
COMMENT ON COLUMN classes.lti_context_id IS 'LTI context identifier (course ID in LMS)';
