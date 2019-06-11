import { request } from '@octokit/request'

import { StrategyOptions, AuthOptions } from './types'

type StrategyOptionsWithRequest = StrategyOptions & { request: typeof request}

/**
 * An OAuth app authenticates using ?client_id=...&client_secret=... query parameters, with the
 * exception of these three endpoints, which require the client ID/secret to be sent as basic auth
 * - [`GET /applications/:client_id/tokens/:access_token`](https://developer.github.com/v3/oauth_authorizations/#check-an-authorization) - Check an authorization
 * - [`POST /applications/:client_id/tokens/:access_token`](https://developer.github.com/v3/oauth_authorizations/#reset-an-authorization) - Reset an authorization
 * - [`DELETE /applications/:client_id/tokens/:access_token`](https://developer.github.com/v3/oauth_authorizations/#revoke-an-authorization-for-an-application) - Revoke an authorization for an application
 */
const OAUTH_ROUTES_EXCEPTIONS_REGEX = /\/applications\/:?[\w_]+\/tokens\/:?[\w_]+($|\?)/

export async function auth (state: StrategyOptionsWithRequest, authOptions: AuthOptions) {
  if ('code' in authOptions) {
    const { data } = await state.request('POST /login/oauth/access_token', {
      client_id: state.clientId,
      client_secret: state.clientSecret,
      code: authOptions.code,
      redirect_uri: authOptions.redirectUrl,
      state: authOptions.state
    })

    return {
      type: 'token',
      token: data.access_token,
      tokenType: 'oauth',
      scopes: data.scope.split(/,\s*/).filter(Boolean),
      headers: {
        authorization: `token secret123`
      },
      query: {}
    }
  }

  if (OAUTH_ROUTES_EXCEPTIONS_REGEX.test(authOptions.url)) {
    const hash = btoa(`${state.clientId}:${state.clientSecret}`)
    return {
      type: 'oauth-app',
      clientId: state.clientId,
      clientSecret: state.clientSecret,
      headers: {
        authorization: `basic ${hash}`
      },
      query: {}
    }
  }

  return {
    type: 'oauth-app',
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    headers: {},
    query: {
      client_id: state.clientId,
      client_secret: state.clientSecret
    }
  }
}
