import { request } from "@octokit/request";
import btoa from "btoa-lite";

import { getOAuthAccessToken } from "./get-oauth-access-token";
import { requiresBasicAuth } from "./requires-basic-auth";
import { State, AuthOptions } from "./types";

export async function auth(state: State, authOptions: AuthOptions) {
  if (authOptions.type === "token") {
    const { token, scopes } = await getOAuthAccessToken(state);

    return {
      type: "token",
      token,
      tokenType: "oauth",
      scopes
    };
  }

  const [headers, query] = requiresBasicAuth(authOptions.url)
    ? [
        {
          authorization: `basic ${btoa(
            `${state.clientId}:${state.clientSecret}`
          )}`
        },
        {}
      ]
    : [
        {},
        {
          client_id: state.clientId,
          client_secret: state.clientSecret
        }
      ];

  return {
    type: "oauth-app",
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    headers,
    query
  };
}
