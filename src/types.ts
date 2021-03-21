import {
  EndpointOptions,
  RequestParameters,
  Route,
  RequestInterface,
  OctokitResponse,
} from "@octokit/types";

import * as AuthOAuthUser from "@octokit/auth-oauth-user";

export type ClientType = "oauth-app" | "github-app";

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

export type AppAuthOptions = {
  type: "oauth-app";
};
export type OAuthAppUserAuthOptions = {
  type: "oauth-user";
  code: string;
  redirectUrl?: string;
  state?: string;
};
export type GitHubAppUserAuthOptions = {
  type: "oauth-user";
  code: string;
  redirectUrl?: string;
  state?: string;
};

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

export type OAuthAppState = OAuthAppStrategyOptions & {
  clientType: "oauth-app";
  request: RequestInterface;
};
export type GitHubAppState = OAuthAppStrategyOptions & {
  clientType: "github-app";
  request: RequestInterface;
};
export interface OAuthAppAuthInterface {
  (options?: AppAuthOptions | OAuthAppUserAuthOptions): Promise<
    AppAuthentication | OAuthAppUserAuthentication
  >;

  hook(
    request: RequestInterface,
    route: Route | EndpointOptions,
    parameters?: RequestParameters
  ): Promise<OctokitResponse<any>>;
}

export interface GitHubAuthInterface {
  (options?: AppAuthOptions | GitHubAppUserAuthOptions): Promise<
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
