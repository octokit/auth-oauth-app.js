import btoa from "btoa-lite";

import { getOAuthAccessToken } from "./get-oauth-access-token";
import {
  State,
  AuthAppOptions,
  AuthTokenOptions,
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

export async function auth(
  state: State,
  authOptions: AuthAppOptions | AuthTokenOptions
): Promise<Authentication> {
  if (authOptions.type === "oauth-user") {
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
