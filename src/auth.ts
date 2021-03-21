import btoa from "btoa-lite";
import { createOAuthUserAuth } from "@octokit/auth-oauth-user";

import {
  // state
  OAuthAppState,
  GitHubAppState,
  // auth options
  AppAuthOptions,
  WebFlowAuthOptions,
  OAuthAppDeviceFlowAuthOptions,
  GitHubDeviceFlowAuthOptions,
  // authentication options
  AppAuthentication,
  OAuthAppUserAuthentication,
  GitHubAppUserAuthentication,
  GitHubAppUserAuthenticationWithExpiration,
} from "./types";
import {
  GitHubAppAuthInterface,
  OAuthAppAuthInterface,
} from "@octokit/auth-oauth-user/dist-types/types";

export async function auth(
  state: OAuthAppState | GitHubAppState,
  authOptions: AppAuthOptions
): Promise<AppAuthentication>;

export async function auth(
  state: OAuthAppState,
  authOptions: WebFlowAuthOptions
): Promise<OAuthAppUserAuthentication>;

export async function auth(
  state: GitHubAppState,
  authOptions: WebFlowAuthOptions
): Promise<
  GitHubAppUserAuthentication | GitHubAppUserAuthenticationWithExpiration
>;

export async function auth(
  state: OAuthAppState,
  authOptions: OAuthAppDeviceFlowAuthOptions
): Promise<OAuthAppUserAuthentication>;

export async function auth(
  state: GitHubAppState,
  authOptions: GitHubDeviceFlowAuthOptions
): Promise<
  GitHubAppUserAuthentication | GitHubAppUserAuthenticationWithExpiration
>;

export async function auth(
  state: OAuthAppState | GitHubAppState,
  authOptions:
    | AppAuthOptions
    | WebFlowAuthOptions
    | OAuthAppDeviceFlowAuthOptions
    | GitHubDeviceFlowAuthOptions
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
    request: state.request,
    ...authOptions,
  };

  // TS: Look what you made me do
  const userAuth =
    state.clientType === "oauth-app"
      ? await createOAuthUserAuth({
          ...common,
          clientType: state.clientType,
        })
      : await createOAuthUserAuth({
          ...common,
          clientType: state.clientType,
        });

  return userAuth();
}
