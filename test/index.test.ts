import fetchMock, { MockMatcherFunction } from "fetch-mock";
import { request } from "@octokit/request";

import { createOAuthAppAuth } from "../src/index";

test("README example with type: 'oauth-app'", async () => {
  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
  });

  const authentication = await auth({
    type: "oauth-app",
  });

  expect(authentication).toEqual({
    type: "oauth-app",
    clientId: "123",
    clientSecret: "secret",
    headers: {
      authorization: "basic MTIzOnNlY3JldA==", // btoa('123:secret')
    },
  });
});

test("README example with `type: 'oauth-user'`", async () => {
  const mock = fetchMock.sandbox().postOnce(
    "https://github.com/login/oauth/access_token",
    {
      access_token: "secret123",
      scope: "",
      token_type: "bearer",
    },
    {
      headers: {
        accept: "application/json",
        "user-agent": "test",
        "content-type": "application/json; charset=utf-8",
      },
      body: {
        client_id: "123",
        client_secret: "secret",
        code: "random123",
        state: "mystate123",
      },
    }
  );

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    request: request.defaults({
      headers: {
        "user-agent": "test",
      },
      request: {
        fetch: mock,
      },
    }),
  });

  const authentication = await auth({
    type: "oauth-user",
    code: "random123",
    state: "mystate123",
  });

  expect(authentication).toEqual({
    type: "token",
    tokenType: "oauth",
    token: "secret123",
    scopes: [],
  });
});

test("request with custom baseUrl (GHE)", async () => {
  const mock = fetchMock.sandbox().postOnce(
    "https://github.acme-inc.com/login/oauth/access_token",
    {
      access_token: "secret123",
      scope: "",
      token_type: "bearer",
    },
    {
      headers: {
        accept: "application/json",
        "user-agent": "test",
        "content-type": "application/json; charset=utf-8",
      },
      body: {
        client_id: "123",
        client_secret: "secret",
        code: "random123",
      },
    }
  );

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    request: request.defaults({
      baseUrl: "https://github.acme-inc.com/api/v3",
      headers: {
        "user-agent": "test",
      },
      request: {
        fetch: mock,
      },
    }),
  });

  const authentication = await auth({
    type: "oauth-user",
    code: "random123",
  });

  expect(authentication).toMatchInlineSnapshot(`
    Object {
      "scopes": Array [],
      "token": "secret123",
      "tokenType": "oauth",
      "type": "token",
    }
  `);
});

test("auth.hook with custom baseUrl (GHE)", async () => {
  const mock = fetchMock.sandbox().postOnce(
    "https://github.acme-inc.com/api/v3/applications/123/token",
    { ok: true },
    {
      body: {
        access_token: "secret123",
      },
    }
  );

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
  });

  const requestWithMock = request.defaults({
    baseUrl: "https://github.acme-inc.com/api/v3",
    request: {
      fetch: mock,
      hook: auth.hook,
    },
  });

  const { data } = await auth.hook(
    requestWithMock,
    "POST /applications/123/token",
    {
      access_token: "secret123",
    }
  );

  expect(data).toEqual({
    ok: true,
  });
});

test("auth.hook(request, 'POST https://github.com/login/oauth/access_token') does not send request twice (#35)", async () => {
  const mock = fetchMock
    .sandbox()
    .postOnce("https://github.com/login/oauth/access_token", {
      access_token: "secret123",
      scope: "",
    });

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
  });

  const requestWithAuth = request.defaults({
    request: {
      fetch: mock,
      hook: auth.hook,
    },
  });

  await requestWithAuth("POST https://github.com/login/oauth/access_token", {
    headers: {
      accept: "application/json",
    },
    type: "token",
    code: "random123",
    state: "mystate123",
  });
});

test("auth.hook(request, 'POST /applications/{client_id}/token') checks token", async () => {
  const mock = fetchMock
    .sandbox()
    .postOnce("https://github.com/login/oauth/access_token", {
      access_token: "secret123",
      scope: "",
    })
    .postOnce(
      "https://api.github.com/applications/123/token",
      {
        token: "secret123",
      },
      {
        body: {
          access_token: "secret123",
        },
      }
    );

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
  });

  const requestWithAuth = request.defaults({
    request: {
      fetch: mock,
      hook: auth.hook,
    },
  });

  const response = await requestWithAuth(
    "POST /applications/{client_id}/token",
    {
      client_id: "123",
      access_token: "secret123",
    }
  );

  expect(response.data.token).toEqual("secret123");
});

test("auth.hook(request, 'GET /user)", async () => {
  const auth = createOAuthAppAuth({
    clientId: "12345678901234567890",
    clientSecret: "1234567890123456789012345678901234567890",
  });

  await expect(async () => auth.hook(request, "GET /user")).rejects.toThrow(
    '[@octokit/auth-oauth-app] "GET /user" does not support clientId/clientSecret basic authentication. Use @octokit/auth-oauth-user instead.'
  );
});
