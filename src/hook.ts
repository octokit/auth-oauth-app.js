import btoa from "btoa-lite";

import { requiresBasicAuth } from "./requires-basic-auth";
import {
  AnyResponse,
  EndpointOptions,
  RequestParameters,
  RequestInterface,
  Route,
  State,
} from "./types";
import { EndpointDefaults } from "@octokit/types";

export async function hook(
  state: State,
  request: RequestInterface,
  route: Route | EndpointOptions,
  parameters?: RequestParameters
): Promise<AnyResponse> {
  let endpoint = request.endpoint.merge(
    route as string,
    parameters
  ) as EndpointDefaults & { url: string };

  // Do not intercept request to retrieve a new token
  if (/\/login\/oauth\/access_token$/.test(endpoint.url as string)) {
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
