import { getUserAgent } from "universal-user-agent";
import { request } from "@octokit/request";

import { auth } from "./auth";
import { hook } from "./hook";
import {
  StrategyOptions,
  AuthOptions,
  Authentication,
  OAuthAppAuthInterface,
} from "./types";
import { VERSION } from "./version";

export type Types = {
  StrategyOptions: StrategyOptions;
  AuthOptions: AuthOptions;
  Authentication: Authentication;
};

export function createOAuthAppAuth(
  options: StrategyOptions
): OAuthAppAuthInterface {
  const state = Object.assign(
    {
      request: request.defaults({
        headers: {
          "user-agent": `octokit-auth-oauth-app.js/${VERSION} ${getUserAgent()}`,
        },
      }),
    },
    options
  );

  // @ts-expect-error not worth the extra code to appease TypeScript
  return Object.assign(auth.bind(null, state), {
    hook: hook.bind(null, state),
  });
}
