import { RequestInterface, State, TokenWithScopes } from "./types";

export async function getOAuthAccessToken(
  state: State,
  customRequest?: RequestInterface
): Promise<TokenWithScopes> {
  if (!state.token) {
    // The "/login/oauth/access_token" is not part of the REST API hosted on api.github.com,
    // instead it’s using the github.com domain.
    const route = /^https:\/\/(api\.)?github\.com$/.test(
      state.request.endpoint.DEFAULTS.baseUrl
    )
      ? "POST https://github.com/login/oauth/access_token"
      : `POST ${state.request.endpoint.DEFAULTS.baseUrl.replace(
          "/api/v3",
          "/login/oauth/access_token"
        )}`;

    const request = customRequest || state.request;
    const { data } = await request(route, {
      headers: {
        accept: "application/json"
      },
      client_id: state.clientId,
      client_secret: state.clientSecret,
      code: state.code,
      redirect_uri: state.redirectUrl,
      state: state.state
    });

    state.token = {
      token: data.access_token,
      scopes: data.scope.split(/,\s*/).filter(Boolean)
    };
  }

  return state.token;
}
