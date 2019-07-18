import { request } from "@octokit/request";

import { createOAuthAppAuth } from "../src/index";

test("README example with `url`", async () => {
  const auth = createOAuthAppAuth({
    clientId: 123,
    clientSecret: "secret"
  });

  const authentication = await auth({ url: "/orgs/:org/repos" });

  expect(authentication).toEqual({
    type: "oauth-app",
    clientId: 123,
    clientSecret: "secret",
    headers: {},
    query: {
      client_id: 123,
      client_secret: "secret"
    }
  });
});

test("README example with `code`", async () => {
  const request = jest.fn().mockResolvedValue({
    data: {
      access_token: "secret123",
      scope: "foo,bar",
      token_type: "bearer"
    }
  });

  const auth = createOAuthAppAuth({
    clientId: 123,
    clientSecret: "secret",
    // @ts-ignore
    request
  });

  const authentication = await auth({ code: "random123" });

  expect(authentication).toEqual({
    type: "token",
    token: "secret123",
    tokenType: "oauth",
    scopes: ["foo", "bar"],
    headers: {
      authorization: "token secret123"
    },
    query: {}
  });

  expect(request).toBeCalledWith("POST /login/oauth/access_token", {
    client_id: 123,
    client_secret: "secret",
    code: "random123"
  });
});

test('`url` is "/applications/:client_id/tokens/:access_token"', async () => {
  const auth = createOAuthAppAuth({
    clientId: 123,
    clientSecret: "secret"
  });

  const authentication = await auth({
    url: "/applications/:client_id/tokens/:access_token"
  });

  expect(authentication).toEqual({
    type: "oauth-app",
    clientId: 123,
    clientSecret: "secret",
    headers: {
      authorization: "basic MTIzOnNlY3JldA==" // btoa('123:secret')
    },
    query: {}
  });
});

test("`code` with `redirectUrl` and `state`", async () => {
  const request = jest.fn().mockResolvedValue({
    data: {
      access_token: "secret123",
      scope: "",
      token_type: "bearer"
    }
  });

  const auth = createOAuthAppAuth({
    clientId: 123,
    clientSecret: "secret",
    // @ts-ignore
    request
  });

  const authentication = await auth({
    code: "random123",
    redirectUrl: "https://example.com/login",
    state: "state123"
  });

  expect(authentication).toEqual({
    type: "token",
    token: "secret123",
    tokenType: "oauth",
    scopes: [],
    headers: {
      authorization: "token secret123"
    },
    query: {}
  });

  expect(request).toBeCalledWith("POST /login/oauth/access_token", {
    client_id: 123,
    client_secret: "secret",
    code: "random123",
    redirect_uri: "https://example.com/login",
    state: "state123"
  });
});
