import btoa from "btoa-lite";

import { getOAuthAccessToken } from "./get-oauth-access-token";
import {
  State,
  AuthAppOptions,
  AuthTokenOptions,
  DeprecatedAuthTokenOptions,
  Authentication,
} from "./types";

export async function auth(
  state: State,
  authOptions: AuthAppOptions
): Promise<Authentication>;

export async function auth(
  state: State,
  authOptions: AuthTokenOptions
): Promise<Authentication>;

/**
 * @deprecated `type: "token"` is deprecate. Use `type: "oauth"` instead
 */
export async function auth(
  state: State,
  authOptions: DeprecatedAuthTokenOptions
): Promise<Authentication>;

export async function auth(
  state: State,
  authOptions: AuthAppOptions | AuthTokenOptions | DeprecatedAuthTokenOptions
): Promise<Authentication> {
  if (authOptions.type === "token") {
    console.warn(
      `[@octokit/auth-oauth-app] "{type: 'token'}" is deprecated, use "{type: 'oauth-user'}" instead`
    );
  }

  if (authOptions.type === "token" || authOptions.type === "oauth-user") {
    const { token, scopes } = await getOAuthAccessToken(state, {
      auth: authOptions,
    });

    return {
      type: "token",
      token,
      tokenType: "oauth",
      scopes,
    };
  }

  return {
    type: "oauth-app",
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    headers: {
      authorization: `basic ${btoa(`${state.clientId}:${state.clientSecret}`)}`,
    },
  };
}
