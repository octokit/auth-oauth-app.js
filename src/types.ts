import {
  EndpointOptions,
  RequestParameters,
  Route,
  RequestInterface,
  OctokitResponse,
} from "@octokit/types";

export type StrategyOptions = {
  clientId: string;
  clientSecret: string;
  request?: RequestInterface;
};

export type AuthAppOptions = {
  type: "oauth-app";
};
export type AuthTokenOptions = {
  type: "oauth-user";
  code: string;
  redirectUrl?: string;
  state?: string;
};

export type AuthOptions = AuthAppOptions | AuthTokenOptions;

export type TokenWithScopes = {
  token: string;
  scopes: string[];
};
export type TokenAuthentication = TokenWithScopes & {
  type: "token";
  tokenType: "oauth";
};
export type appAuthentication = {
  type: "oauth-app";
  clientId: string;
  clientSecret: string;
  headers: {
    authorization: string;
  };
};
export type Authentication = TokenAuthentication | appAuthentication;
export type State = StrategyOptions & {
  request: RequestInterface;
};
export interface OAuthAppAuthInterface {
  (options?: AuthOptions): Promise<Authentication>;

  hook(
    request: RequestInterface,
    route: Route | EndpointOptions,
    parameters?: RequestParameters
  ): Promise<OctokitResponse<any>>;
}
