import { getUserAgent } from "universal-user-agent";
import { request } from "@octokit/request";

import { auth } from "./auth";
import { hook } from "./hook";
import type {
  OAuthAppStrategyOptions,
  GitHubAppStrategyOptions,
  OAuthAppAuthInterface,
  GitHubAuthInterface,
} from "./types";
import { VERSION } from "./version";

export type {
  // strategy options
  OAuthAppStrategyOptions,
  GitHubAppStrategyOptions,
  // auth options
  AppAuthOptions,
  WebFlowAuthOptions,
  OAuthAppDeviceFlowAuthOptions,
  GitHubAppDeviceFlowAuthOptions,
  // auth interfaces
  OAuthAppAuthInterface,
  GitHubAuthInterface,
  // authentication object
  AppAuthentication,
  OAuthAppUserAuthentication,
  GitHubAppUserAuthentication,
  GitHubAppUserAuthenticationWithExpiration,
  // needed by @octokit/auth-app
  FactoryGitHubWebFlow,
  FactoryGitHubDeviceFlow,
} from "./types";
export { createOAuthUserAuth } from "@octokit/auth-oauth-user";

export function createOAuthAppAuth(
  options: OAuthAppStrategyOptions,
): OAuthAppAuthInterface;

export function createOAuthAppAuth(
  options: GitHubAppStrategyOptions,
): GitHubAuthInterface;

export function createOAuthAppAuth(
  options: OAuthAppStrategyOptions | GitHubAppStrategyOptions,
): OAuthAppAuthInterface | GitHubAuthInterface {
  const state = Object.assign(
    {
      request: request.defaults({
        headers: {
          "user-agent": `octokit-auth-oauth-app.js/${VERSION} ${getUserAgent()}`,
        },
      }),
      clientType: "oauth-app",
    },
    options,
  );

  // @ts-expect-error not worth the extra code to appease TS
  return Object.assign(auth.bind(null, state), {
    hook: hook.bind(null, state),
  });
}
