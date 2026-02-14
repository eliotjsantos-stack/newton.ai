# LTI 1.3 Advantage Integration

This document describes how to integrate Newton AI with Learning Management Systems (LMS) using the LTI 1.3 Advantage standard.

## Important Note: Google Classroom

**Google Classroom does NOT support LTI.** If you need to integrate with Google Classroom, you must use the [Google Classroom API](https://developers.google.com/classroom) instead.

This LTI integration works with:
- Canvas (by Instructure)
- Moodle
- Blackboard Learn
- D2L Brightspace
- Schoology
- Any other LTI 1.3 compliant LMS

## Overview

LTI 1.3 uses OAuth 2.0 and OpenID Connect for secure authentication. The flow is:

1. **Teacher adds Newton as an External Tool** in their LMS
2. **User clicks the tool** → LMS sends login initiation to `/api/lti/login`
3. **Newton redirects to LMS** for OIDC authentication
4. **LMS authenticates user** and redirects to `/api/lti/launch` with JWT
5. **Newton verifies JWT** and creates/links user account
6. **User is redirected** to the appropriate Newton page

## Setup

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# Required
NEXT_PUBLIC_APP_URL=https://your-newton-domain.com

# LTI Security (generate secure random values)
LTI_STATE_SECRET=your-secure-random-string-at-least-32-chars

# Optional: Pre-generated RSA keys (recommended for production)
# Generate with: openssl genrsa -out private.pem 2048
# Then: openssl rsa -in private.pem -pubout -out public.pem
LTI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
LTI_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
LTI_KEY_ID=newton-lti-key-1

# Admin key for registering platforms via API
LTI_ADMIN_KEY=your-admin-api-key
```

### 2. Database Migration

Run the LTI migration to create required tables:

```sql
-- See: supabase/migrations/005_lti_tables.sql
```

### 3. Register Your Platform

Each LMS that uses Newton must be registered. This can be done:

**Option A: Via API**
```bash
curl -X POST https://your-newton-domain.com/api/lti/config \
  -H "Authorization: Bearer YOUR_LTI_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "issuer": "https://canvas.instructure.com",
    "clientId": "12345",
    "deploymentId": "optional-deployment-id",
    "oidcAuthUrl": "https://canvas.instructure.com/api/lti/authorize_redirect",
    "jwksUrl": "https://canvas.instructure.com/api/lti/security/jwks",
    "tokenUrl": "https://canvas.instructure.com/login/oauth2/token",
    "name": "My School Canvas"
  }'
```

**Option B: Directly in Database**
```sql
INSERT INTO lti_platforms (issuer, client_id, name, oidc_auth_url, jwks_url, token_url)
VALUES (
  'https://canvas.instructure.com',
  '12345',
  'My School Canvas',
  'https://canvas.instructure.com/api/lti/authorize_redirect',
  'https://canvas.instructure.com/api/lti/security/jwks',
  'https://canvas.instructure.com/login/oauth2/token'
);
```

## LMS Configuration

### Canvas

1. Go to **Admin** → **Developer Keys** → **+ Developer Key** → **LTI Key**
2. Configure:
   - **Key Name**: Newton AI
   - **Redirect URIs**: `https://your-domain.com/api/lti/launch`
   - **Target Link URI**: `https://your-domain.com/api/lti/launch`
   - **OpenID Connect Initiation URL**: `https://your-domain.com/api/lti/login`
   - **JWK Method**: Public JWK URL
   - **Public JWK URL**: `https://your-domain.com/api/lti/jwks`
3. Enable the key and note the **Client ID**
4. Go to **Settings** → **Apps** → **+ App** → **By Client ID**
5. Enter the Client ID and install

### Moodle

1. Go to **Site Administration** → **Plugins** → **External Tool** → **Manage Tools**
2. Click **Configure a tool manually**
3. Configure:
   - **Tool name**: Newton AI
   - **Tool URL**: `https://your-domain.com/api/lti/launch`
   - **LTI version**: LTI 1.3
   - **Public key type**: Keyset URL
   - **Public keyset**: `https://your-domain.com/api/lti/jwks`
   - **Initiate login URL**: `https://your-domain.com/api/lti/login`
   - **Redirection URI(s)**: `https://your-domain.com/api/lti/launch`
4. Save and note the issued **Client ID** and platform details

### Blackboard Learn

1. Go to **System Admin** → **LTI Tool Providers** → **Register LTI 1.3 Tool**
2. Enter:
   - **Client ID**: (will be generated)
   - **Tool Provider URL**: `https://your-domain.com/api/lti/launch`
   - **Login Initiation URL**: `https://your-domain.com/api/lti/login`
   - **Tool Redirect URL**: `https://your-domain.com/api/lti/launch`
   - **Tool JWKS URL**: `https://your-domain.com/api/lti/jwks`

### Schoology

1. Contact Schoology support to register an LTI 1.3 tool
2. Provide:
   - **Launch URL**: `https://your-domain.com/api/lti/launch`
   - **Login URL**: `https://your-domain.com/api/lti/login`
   - **Redirect URL**: `https://your-domain.com/api/lti/launch`
   - **JWKS URL**: `https://your-domain.com/api/lti/jwks`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/lti/login` | GET/POST | OIDC login initiation |
| `/api/lti/launch` | POST | Main launch endpoint (receives JWT) |
| `/api/lti/jwks` | GET | Tool's public keys (JWKS) |
| `/api/lti/config` | GET | Tool configuration JSON/XML |
| `/api/lti/config` | POST | Register a new platform (admin) |

## Configuration Export

Get tool configuration for your LMS:

- **JSON format**: `GET /api/lti/config`
- **Canvas XML**: `GET /api/lti/config?format=xml`

## Security Considerations

### State Parameter
The state parameter protects against CSRF attacks. Newton uses encrypted state tokens that work even when third-party cookies are blocked (common in iframes).

### Nonce
Each launch includes a nonce to prevent replay attacks. Used nonces are stored and checked.

### JWT Verification
All launch tokens are verified against the platform's public keys (fetched from JWKS endpoint).

### Cookie Settings
For iframe embedding, cookies use `SameSite=None; Secure` which requires HTTPS.

## Troubleshooting

### "Unknown platform" error
The platform hasn't been registered. Register it via the API or database.

### "Token verification failed"
- Check that the platform's JWKS URL is accessible
- Verify the client_id matches what's registered
- Check for clock skew between servers

### "Invalid state" error
- The state token expired (5 minutes)
- Third-party cookies are blocked and database state lookup failed
- User took too long to complete authentication

### Cookies not working in iframe
Ensure your domain uses HTTPS and cookies have `SameSite=None; Secure`.

## Custom Parameters

You can pass custom parameters from the LMS to Newton:

```
year_group=$Context.sourcedId
subject=$ResourceLink.title
```

These are accessible in the launch data as `launchData.custom`.

## LTI Advantage Services

Newton supports these LTI Advantage services (when available from the platform):

- **Names and Role Provisioning Service (NRPS)**: Get class roster
- **Assignment and Grade Services (AGS)**: Send grades back to LMS
- **Deep Linking**: Let teachers embed specific Newton content

## References

- [LTI 1.3 Core Specification](https://www.imsglobal.org/spec/lti/v1p3/)
- [LTI 1.3 Implementation Guide](https://www.imsglobal.org/spec/lti/v1p3/impl)
- [Blackboard LTI Tutorial](https://blackboard.github.io/lti/tutorials/implementation-guide)
- [Canvas LTI Documentation](https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html)

Sources:
- [IMS Global LTI 1.3 Specification](https://www.imsglobal.org/spec/lti/v1p3/)
- [Blackboard OIDC Login Guide](https://blackboard.github.io/lti/core/oidc-login)
- [TypeScript LTI Library](https://dev.to/jamesjoplin/building-the-first-typescript-lti-13-library-so-you-dont-have-to-4h09)
- [Google Classroom LTI Support](https://ed.link/community/does-google-support-lti-1-3-lti-advantage/)
