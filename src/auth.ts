import btoa from "btoa-lite";
import { exchangeWebFlowCode } from "@octokit/oauth-methods";

import {
  // state
  OAuthAppState,
  GitHubAppState,
  // auth options
  AppAuthOptions,
  OAuthAppUserAuthOptions,
  GitHubAppUserAuthOptions,
  // authentication options
  AppAuthentication,
  OAuthAppUserAuthentication,
  GitHubAppUserAuthentication,
  GitHubAppUserAuthenticationWithExpiration,
} from "./types";

export async function auth(
  state: OAuthAppState | GitHubAppState,
  authOptions: AppAuthOptions
): Promise<AppAuthentication>;

export async function auth(
  state: OAuthAppState,
  authOptions: OAuthAppUserAuthOptions
): Promise<OAuthAppUserAuthentication>;

export async function auth(
  state: GitHubAppState,
  authOptions: GitHubAppUserAuthOptions
): Promise<
  GitHubAppUserAuthentication | GitHubAppUserAuthenticationWithExpiration
>;

export async function auth(
  state: OAuthAppState | GitHubAppState,
  authOptions:
    | AppAuthOptions
    | OAuthAppUserAuthOptions
    | GitHubAppUserAuthOptions
): Promise<
  | AppAuthentication
  | OAuthAppUserAuthentication
  | GitHubAppUserAuthentication
  | GitHubAppUserAuthenticationWithExpiration
> {
  if (authOptions.type === "oauth-app") {
    return {
      type: "oauth-app",
      clientId: state.clientId,
      clientSecret: state.clientSecret,
      clientType: state.clientType,
      headers: {
        authorization: `basic ${btoa(
          `${state.clientId}:${state.clientSecret}`
        )}`,
      },
    };
  }

  const common = {
    clientId: state.clientId,
    clientSecret: state.clientSecret,
    code: authOptions.code,
    state: authOptions.state,
    redirectUrl: authOptions.redirectUrl,
    request: state.request,
  };

  // Look what you made me do, TS
  const { authentication } =
    state.clientType === "oauth-app"
      ? await exchangeWebFlowCode({
          ...common,
          clientType: state.clientType,
        })
      : await exchangeWebFlowCode({
          ...common,
          clientType: state.clientType,
        });

  return { ...authentication, tokenType: "oauth", type: "token" };
}
