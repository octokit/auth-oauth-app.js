import btoa from "btoa-lite";

import { getOAuthAccessToken } from "./get-oauth-access-token";
import { requiresBasicAuth } from "./requires-basic-auth";
import {
  AnyResponse,
  Defaults,
  Endpoint,
  Parameters,
  Request,
  Route,
  State
} from "./types";

export async function hook(
  state: State,
  request: Request,
  route: Route | Endpoint,
  parameters?: Parameters
): Promise<AnyResponse> {
  let endpoint: Defaults = request.endpoint.merge(route as string, parameters);

  const { token } = await getOAuthAccessToken(state, request);

  if (!requiresBasicAuth(endpoint.url)) {
    endpoint.headers.authorization = `token ${token}`;

    return request(endpoint as Endpoint);
  }

  const credentials = btoa(`${state.clientId}:${state.clientSecret}`);
  endpoint.headers.authorization = `basic ${credentials}`;

  // default `:client_id` & `:access_token` URL parameters
  if (/:client_id/.test(endpoint.url)) {
    endpoint = Object.assign(
      {
        client_id: state.clientId,
        access_token: token
      },
      endpoint
    );
  }

  const response = await request(endpoint as Endpoint);

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
