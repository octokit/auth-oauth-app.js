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

const deprecatedStrategyOptions = ["code", "redirectUrl", "state"];

export function createOAuthAppAuth(
  options: StrategyOptions
): OAuthAppAuthInterface {
  const usedDeprecatedOptions = deprecatedStrategyOptions.filter(
    (option) => option in options
  );

  if (usedDeprecatedOptions.length) {
    console.warn(
      `[@octokit/auth-oauth-app] "${usedDeprecatedOptions.join(
        ", "
      )}" strategy options are deprecated. Use "@octokit/auth-oauth-user" instead`
    );
  }

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

  // @ts-expect-error wtf
  return Object.assign(auth.bind(null, state), {
    hook: hook.bind(null, state),
  });
}
