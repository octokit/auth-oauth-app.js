import btoa from "btoa-lite";
import { requiresBasicAuth } from "@octokit/auth-oauth-user";
import {
  EndpointDefaults,
  EndpointOptions,
  RequestParameters,
  Route,
  RequestInterface,
  OctokitResponse,
} from "@octokit/types";

import { OAuthAppState, GitHubAppState } from "./types";

export async function hook(
  state: OAuthAppState | GitHubAppState,
  request: RequestInterface,
  route: Route | EndpointOptions,
  parameters?: RequestParameters
): Promise<OctokitResponse<any>> {
  let endpoint = request.endpoint.merge(
    route as string,
    parameters
  ) as EndpointDefaults & { url: string };

  // Do not intercept OAuth Web/Device flow request
  if (
    /\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url as string)
  ) {
    return request(endpoint);
  }

  if (!requiresBasicAuth(endpoint.url)) {
    throw new Error(
      `[@octokit/auth-oauth-app] "${endpoint.method} ${endpoint.url}" does not support clientId/clientSecret basic authentication. Use @octokit/auth-oauth-user instead.`
    );
  }

  const credentials = btoa(`${state.clientId}:${state.clientSecret}`);
  endpoint.headers.authorization = `basic ${credentials}`;

  return await request(endpoint);
}
