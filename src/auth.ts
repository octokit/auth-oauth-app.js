import btoa from "btoa-lite";
import { exchangeWebFlowCode } from "@octokit/oauth-methods";

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
    const {
      authentication: { token, scopes },
    } = await exchangeWebFlowCode({
      clientType: "oauth-app",
      clientId: state.clientId,
      clientSecret: state.clientSecret,
      code: authOptions.code,
      state: authOptions.state,
      redirectUrl: authOptions.redirectUrl,
      request: state.request,
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
