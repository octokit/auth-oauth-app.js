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
export type GitHubDeviceFlowAuthOptions = {
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
export type GitHubAppUserAuthenticationWithExpiration = AuthOAuthUser.GitHubAppAuthenticationWithExpiration;

export interface OAuthAppAuthInterface {
  (
    options?:
      | AppAuthOptions
      | WebFlowAuthOptions
      | OAuthAppDeviceFlowAuthOptions
  ): Promise<AppAuthentication | OAuthAppUserAuthentication>;

  hook(
    request: RequestInterface,
    route: Route | EndpointOptions,
    parameters?: RequestParameters
  ): Promise<OctokitResponse<any>>;
}

export interface GitHubAuthInterface {
  (
    options?: AppAuthOptions | WebFlowAuthOptions | GitHubDeviceFlowAuthOptions
  ): Promise<
    | AppAuthentication
    | GitHubAppUserAuthentication
    | GitHubAppUserAuthenticationWithExpiration
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
export type GitHubAppState = OAuthAppStrategyOptions & {
  clientType: "github-app";
  request: RequestInterface;
};
