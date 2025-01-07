import { requiresBasicAuth } from "@octokit/auth-oauth-user";
import type {
  EndpointDefaults,
  EndpointOptions,
  RequestParameters,
  Route,
  RequestInterface,
  OctokitResponse,
} from "@octokit/types";

import type { OAuthAppState, GitHubAppState } from "./types.js";

export async function hook(
  state: OAuthAppState | GitHubAppState,
  request: RequestInterface,
  route: Route | EndpointOptions,
  parameters?: RequestParameters,
): Promise<OctokitResponse<any>> {
  let endpoint = request.endpoint.merge(
    route as string,
    parameters,
  ) as EndpointDefaults & { url: string };

  // Do not intercept OAuth Web/Device flow request
  if (
    /\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url as string)
  ) {
    return request(endpoint);
  }

  if (state.clientType === "github-app" && !requiresBasicAuth(endpoint.url)) {
    throw new Error(
      `[@octokit/auth-oauth-app] GitHub Apps cannot use their client ID/secret for basic authentication for endpoints other than "/applications/{client_id}/**". "${endpoint.method} ${endpoint.url}" is not supported.`,
    );
  }

  const credentials = btoa(`${state.clientId}:${state.clientSecret}`);
  endpoint.headers.authorization = `basic ${credentials}`;

  try {
    return await request(endpoint);
  } catch (error: any) {
    /* v8 ignore next */
    if (error.status !== 401) throw error;

    error.message = `[@octokit/auth-oauth-app] "${endpoint.method} ${endpoint.url}" does not support clientId/clientSecret basic authentication.`;
    throw error;
  }
}
