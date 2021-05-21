import {
  EndpointOptions,
  RequestParameters,
  Route,
  RequestInterface,
  OctokitResponse,
} from "@octokit/types";

import * as AuthOAuthUser from "@octokit/auth-oauth-user";
import * as DeviceTypes from "@octokit/auth-oauth-device";

export type ClientType = "oauth-app" | "github-app";

// STRATEGY OPTIONS

export type OAuthAppStrategyOptions = {
  clientType?: "oauth-app";
  clientId: string;
  clientSecret: string;
  request?: RequestInterface;
};

export type GitHubAppStrategyOptions = {
  clientType: "github-app";
  clientId: string;
  clientSecret: string;
  request?: RequestInterface;
};

// AUTH OPTIONS

export type AppAuthOptions = {
  type: "oauth-app";
};
export type WebFlowAuthOptions = {
  type: "oauth-user";
  code: string;
  redirectUrl?: string;
  state?: string;
};
export type OAuthAppDeviceFlowAuthOptions = {
  type: "oauth-user";
  onVerification: DeviceTypes.OAuthAppStrategyOptions["onVerification"];
  scopes?: string[];
};
export type GitHubAppDeviceFlowAuthOptions = {
  type: "oauth-user";
  onVerification: DeviceTypes.OAuthAppStrategyOptions["onVerification"];
};

// AUTHENTICATION OBJECT

export type AppAuthentication = {
  type: "oauth-app";
  clientId: string;
  clientSecret: string;
  clientType: ClientType;
  headers: {
    authorization: string;
  };
};

export type OAuthAppUserAuthentication = AuthOAuthUser.OAuthAppAuthentication;
export type GitHubAppUserAuthentication = AuthOAuthUser.GitHubAppAuthentication;
export type GitHubAppUserAuthenticationWithExpiration =
  AuthOAuthUser.GitHubAppAuthenticationWithExpiration;

export type FactoryOAuthAppWebFlowOptions = OAuthAppStrategyOptions &
  Omit<WebFlowAuthOptions, "type"> & { clientType: "oauth-app" };
export type FactoryOAuthAppDeviceFlowOptions = OAuthAppStrategyOptions &
  Omit<OAuthAppDeviceFlowAuthOptions, "type"> & { clientType: "oauth-app" };
export type FactoryGitHubAppWebFlowOptions = GitHubAppStrategyOptions &
  Omit<WebFlowAuthOptions, "type"> & { clientType: "github-app" };
export type FactoryGitHubAppDeviceFlowOptions = GitHubAppStrategyOptions &
  Omit<GitHubAppDeviceFlowAuthOptions, "type"> & {
    clientType: "github-app";
  };

export interface FactoryOAuthAppWebFlow<T> {
  (options: FactoryOAuthAppWebFlowOptions): T;
}
export interface FactoryOAuthAppDeviceFlow<T> {
  (options: FactoryOAuthAppDeviceFlowOptions): T;
}
export interface FactoryGitHubWebFlow<T> {
  (options: FactoryGitHubAppWebFlowOptions): T;
}
export interface FactoryGitHubDeviceFlow<T> {
  (options: FactoryGitHubAppDeviceFlowOptions): T;
}

export interface OAuthAppAuthInterface {
  // app auth
  (options: AppAuthOptions): Promise<AppAuthentication>;

  // user auth with `factory` option
  <T = unknown>(
    options: WebFlowAuthOptions & { factory: FactoryOAuthAppWebFlow<T> }
  ): Promise<T>;
  <T = unknown>(
    options: OAuthAppDeviceFlowAuthOptions & {
      factory: FactoryOAuthAppDeviceFlow<T>;
    }
  ): Promise<T>;

  // user auth without `factory` option
  (options: WebFlowAuthOptions): Promise<OAuthAppUserAuthentication>;
  (options: OAuthAppDeviceFlowAuthOptions): Promise<OAuthAppUserAuthentication>;

  hook(
    request: RequestInterface,
    route: Route | EndpointOptions,
    parameters?: RequestParameters
  ): Promise<OctokitResponse<any>>;
}

export interface GitHubAuthInterface {
  // app auth
  (options?: AppAuthOptions): Promise<AppAuthentication>;

  // user auth with `factory` option
  <T = unknown>(
    options: WebFlowAuthOptions & { factory: FactoryGitHubWebFlow<T> }
  ): Promise<T>;
  <T = unknown>(
    options: GitHubAppDeviceFlowAuthOptions & {
      factory: FactoryGitHubDeviceFlow<T>;
    }
  ): Promise<T>;

  // user auth without `factory` option
  (options?: WebFlowAuthOptions): Promise<
    GitHubAppUserAuthentication | GitHubAppUserAuthenticationWithExpiration
  >;
  (options?: GitHubAppDeviceFlowAuthOptions): Promise<
    GitHubAppUserAuthentication | GitHubAppUserAuthenticationWithExpiration
  >;

  hook(
    request: RequestInterface,
    route: Route | EndpointOptions,
    parameters?: RequestParameters
  ): Promise<OctokitResponse<any>>;
}

//  INTERNAL

export type OAuthAppState = OAuthAppStrategyOptions & {
  clientType: "oauth-app";
  request: RequestInterface;
};
export type GitHubAppState = GitHubAppStrategyOptions & {
  clientType: "github-app";
  request: RequestInterface;
};
