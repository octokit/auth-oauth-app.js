import btoa from "btoa-lite";

import { getOAuthAccessToken } from "./get-oauth-access-token";
import { requiresBasicAuth } from "./requires-basic-auth";
import {
  AnyResponse,
  EndpointOptions,
  RequestParameters,
  RequestInterface,
  Route,
  State
} from "./types";

export async function hook(
  state: State,
  request: RequestInterface,
  route: Route | EndpointOptions,
  parameters?: RequestParameters
): Promise<AnyResponse> {
  let endpoint = request.endpoint.merge(route as string, parameters);

  // Do not intercept request to retrieve a new token
  if (/\/login\/oauth\/access_token$/.test(endpoint.url as string)) {
    return request(endpoint as EndpointOptions);
  }

  const { token } = await getOAuthAccessToken(state, { request });

  if (!requiresBasicAuth(endpoint.url)) {
    endpoint.headers.authorization = `token ${token}`;

    return request(endpoint as EndpointOptions);
  }

  const credentials = btoa(`${state.clientId}:${state.clientSecret}`);
  endpoint.headers.authorization = `basic ${credentials}`;

  // default `:client_id` & `:access_token` URL parameters
  if (endpoint.url && /:client_id/.test(endpoint.url)) {
    endpoint = Object.assign(
      {
        client_id: state.clientId,
        access_token: token
      },
      endpoint
    );
  }

  const response = await request(endpoint as EndpointOptions);

  // `POST /applications/:client_id/tokens/:access_token` resets the passed token
  // and returns a new one. If that’s the current request then update internal state.
  const parsedEndpoint = request.endpoint.parse(endpoint);
  const isTokenResetRequest =
    parsedEndpoint.method === "POST" &&
    new RegExp(token).test(parsedEndpoint.url);
  if (isTokenResetRequest && state.token) {
    state.token.token = response.data.token;
  }

  return response;
}
