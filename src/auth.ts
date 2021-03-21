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
  GitHubAppDeviceFlowAuthOptions,
  FactoryOAuthAppWebFlow,
  FactoryOAuthAppDeviceFlow,
  FactoryGitHubWebFlow,
  FactoryGitHubDeviceFlow,
  // authentication options
  AppAuthentication,
  OAuthAppUserAuthentication,
  GitHubAppUserAuthentication,
  GitHubAppUserAuthenticationWithExpiration,
} from "./types";

//  App authentication
export async function auth(
  state: OAuthAppState | GitHubAppState,
  authOptions: AppAuthOptions
): Promise<AppAuthentication>;

// OAuth App Web flow
export async function auth(
  state: OAuthAppState,
  authOptions: WebFlowAuthOptions
): Promise<OAuthAppUserAuthentication>;

// OAuth App Web flow with `factory` option
export async function auth<T = unknown>(
  state: OAuthAppState,
  authOptions: WebFlowAuthOptions & { factory: FactoryOAuthAppWebFlow<T> }
): Promise<T>;

// Oauth App Device Flow
export async function auth(
  state: OAuthAppState,
  authOptions: OAuthAppDeviceFlowAuthOptions
): Promise<OAuthAppUserAuthentication>;

// OAuth App Device flow with `factory` option
export async function auth<T = unknown>(
  state: OAuthAppState,
  authOptions: OAuthAppDeviceFlowAuthOptions & {
    factory: FactoryOAuthAppDeviceFlow<T>;
  }
): Promise<T>;

// GitHub App Web flow
export async function auth(
  state: GitHubAppState,
  authOptions: WebFlowAuthOptions
): Promise<
  GitHubAppUserAuthentication | GitHubAppUserAuthenticationWithExpiration
>;

// GitHub App Web flow with `factory` option
export async function auth<T = unknown>(
  state: GitHubAppState,
  authOptions: WebFlowAuthOptions & { factory: FactoryGitHubWebFlow<T> }
): Promise<T>;

// GitHub App Device Flow
export async function auth(
  state: GitHubAppState,
  authOptions: GitHubAppDeviceFlowAuthOptions
): Promise<
  GitHubAppUserAuthentication | GitHubAppUserAuthenticationWithExpiration
>;

// GitHub App Device flow with `factory` option
export async function auth<T = unknown>(
  state: GitHubAppState,
  authOptions: GitHubAppDeviceFlowAuthOptions & {
    factory: FactoryGitHubDeviceFlow<T>;
  }
): Promise<T>;

export async function auth<T = unknown>(
  state: OAuthAppState | GitHubAppState,
  authOptions:
    | AppAuthOptions
    | WebFlowAuthOptions
    | OAuthAppDeviceFlowAuthOptions
    | GitHubAppDeviceFlowAuthOptions
    | (WebFlowAuthOptions & { factory: FactoryOAuthAppWebFlow<T> })
    | (OAuthAppDeviceFlowAuthOptions & {
        factory: FactoryOAuthAppDeviceFlow<T>;
      })
    | (WebFlowAuthOptions & { factory: FactoryGitHubWebFlow<T> })
    | (GitHubAppDeviceFlowAuthOptions & {
        factory: FactoryGitHubDeviceFlow<T>;
      })
): Promise<
  | AppAuthentication
  | OAuthAppUserAuthentication
  | GitHubAppUserAuthentication
  | GitHubAppUserAuthenticationWithExpiration
  | T
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

  if ("factory" in authOptions) {
    const { type, ...options } = {
      ...authOptions,
      ...state,
    };

    // @ts-expect-error TODO: `option` cannot be never, is this a bug?
    return authOptions.factory(options);
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
