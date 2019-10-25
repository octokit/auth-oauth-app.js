/**
 * An OAuth app authenticates using ?client_id=...&client_secret=... query parameters, with the
 * exception of these three endpoints, which require the client ID/secret to be sent as basic auth
 * - [`GET /applications/:client_id/tokens/:access_token`](https://developer.github.com/v3/oauth_authorizations/#check-an-authorization) - Check an authorization
 * - [`POST /applications/:client_id/tokens/:access_token`](https://developer.github.com/v3/oauth_authorizations/#reset-an-authorization) - Reset an authorization
 * - [`DELETE /applications/:client_id/tokens/:access_token`](https://developer.github.com/v3/oauth_authorizations/#revoke-an-authorization-for-an-application) - Revoke an authorization for an application
 */
const OAUTH_ROUTES_EXCEPTIONS_REGEX = /\/applications\/:?[\w_]+\/tokens\/:?[\w_]+($|\?)/;

export function requiresBasicAuth(url: string | undefined) {
  return url && OAUTH_ROUTES_EXCEPTIONS_REGEX.test(url);
}
