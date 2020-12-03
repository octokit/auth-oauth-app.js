import fetchMock, { MockMatcherFunction } from "fetch-mock";
import { request } from "@octokit/request";

import { createOAuthAppAuth } from "../src/index";

test("README example with type: 'oauth-app'", async () => {
  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123",
    state: "mystate123",
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

test("README example with `type: 'token'`", async () => {
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
    type: "token",
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

test("`code`, `redirectUrl`, `state` set as strategyOptions", async () => {
  const matchCreateAccessToken: MockMatcherFunction = (
    url,
    { body, headers }
  ) => {
    expect(url).toEqual("https://github.com/login/oauth/access_token");
    expect(headers).toStrictEqual({
      accept: "application/json",
      "user-agent": "test",
      "content-type": "application/json; charset=utf-8",
    });
    expect(JSON.parse(String(body))).toStrictEqual({
      client_id: "123",
      client_secret: "secret",
      code: "random123",
      redirect_uri: "https://example.com/login",
      state: "mystate123",
    });

    return true;
  };

  const createAccessTokenResponseData = {
    access_token: "secret123",
    scope: "",
    token_type: "bearer",
  };

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123",
    state: "mystate123",
    redirectUrl: "https://example.com/login",
    request: request.defaults({
      headers: {
        "user-agent": "test",
      },
      request: {
        fetch: fetchMock
          .sandbox()
          .postOnce(matchCreateAccessToken, createAccessTokenResponseData),
      },
    }),
  });

  const authentication = await auth({
    type: "token",
  });

  expect(authentication).toEqual({
    type: "token",
    token: "secret123",
    tokenType: "oauth",
    scopes: [],
  });
});

test("`code`, `redirectUrl`, `state` set as both strategyOptions and authOptions", async () => {
  const matchCreateAccessToken: MockMatcherFunction = (
    url,
    { body, headers }
  ) => {
    expect(url).toEqual("https://github.com/login/oauth/access_token");
    expect(headers).toStrictEqual({
      accept: "application/json",
      "user-agent": "test",
      "content-type": "application/json; charset=utf-8",
    });
    expect(JSON.parse(String(body))).toStrictEqual({
      client_id: "123",
      client_secret: "secret",
      code: "random123",
      redirect_uri: "https://example.com/login",
      state: "mystate123",
    });

    return true;
  };

  const createAccessTokenResponseData = {
    access_token: "secret123",
    scope: "",
    token_type: "bearer",
  };

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "strategyrandom123",
    state: "strategymystate123",
    redirectUrl: "https://example.com/loginstrategy",
    request: request.defaults({
      headers: {
        "user-agent": "test",
      },
      request: {
        fetch: fetchMock
          .sandbox()
          .postOnce(matchCreateAccessToken, createAccessTokenResponseData),
      },
    }),
  });

  const authentication = await auth({
    type: "token",
    code: "random123",
    state: "mystate123",
    redirectUrl: "https://example.com/login",
  });

  expect(authentication).toEqual({
    type: "token",
    token: "secret123",
    tokenType: "oauth",
    scopes: [],
  });
});

test("test with request instance that has custom baseUrl (GHE)", async () => {
  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123",
    state: "mystate123",
    request: request.defaults({
      baseUrl: "https://github.acme-inc.com/api/v3",
      request: {
        fetch: fetchMock
          .sandbox()
          .postOnce("https://github.acme-inc.com/login/oauth/access_token", {
            access_token: "secret123",
            scope: "",
          }),
      },
    }),
  });

  const authentication = await auth({ type: "token" });

  expect(authentication).toEqual({
    type: "token",
    tokenType: "oauth",
    token: "secret123",
    scopes: [],
  });
});

test("auth.hook() creates token and uses it for succeeding requests (if code option was set)", async () => {
  const mock = fetchMock
    .sandbox()
    .postOnce("https://github.com/login/oauth/access_token", {
      access_token: "secret123",
      scope: "",
    })
    .get(
      "https://api.github.com/user",
      { id: 123 },
      {
        headers: {
          authorization: "token secret123",
        },
        repeat: 4,
      }
    );

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123",
    state: "mystate123",
  });

  const requestWithMock = request.defaults({
    request: {
      fetch: mock,
    },
  });
  const requestWithAuth = requestWithMock.defaults({
    request: {
      hook: auth.hook,
    },
  });

  await auth.hook(requestWithMock, "GET /user");
  await auth.hook(requestWithMock, "GET /user");

  await requestWithAuth("GET /user");
  await requestWithAuth("GET /user");

  expect(mock.done()).toBe(true);
});

test("auth.hook() does not attempt to create token if code option was not set", async () => {
  const mock = fetchMock.sandbox().get(
    "https://api.github.com/repos/octocat/hello-world",
    { id: 123 },
    {
      headers: {
        authorization: "basic MTIzOnNlY3JldA==", // btoa('123:secret')
      },
    }
  );

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
  });

  const requestWithAuth = request
    .defaults({
      request: {
        fetch: mock,
      },
    })
    .defaults({
      request: {
        hook: auth.hook,
      },
    });

  await requestWithAuth("GET /repos/octocat/hello-world");

  expect(mock.done()).toBe(true);
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

test("auth.hook(request, 'POST /applications/{client_id}/tokens/{access_token}') resets the used token (legacy endpoint)", async () => {
  const mock = fetchMock
    .sandbox()
    .postOnce("https://github.com/login/oauth/access_token", {
      access_token: "secret123",
      scope: "",
    })
    .getOnce(
      "https://api.github.com/user",
      { id: 123 },
      {
        headers: {
          authorization: "token secret123",
        },
      }
    )
    .postOnce("https://api.github.com/applications/123/tokens/secret123", {
      token: "newsecret123",
    })
    .getOnce(
      "https://api.github.com/user",
      { id: 123 },
      {
        headers: {
          authorization: "token newsecret123",
        },
        overwriteRoutes: false,
      }
    );

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123",
    state: "mystate123",
  });

  const requestWithAuth = request.defaults({
    request: {
      fetch: mock,
      hook: auth.hook,
    },
  });

  const response1 = await requestWithAuth("GET /user");
  expect(response1.data.id).toEqual(123);

  await requestWithAuth(
    "POST /applications/{client_id}/tokens/{access_token}",
    {
      client_id: "123",
      access_token: "secret123",
    }
  );

  const response2 = await requestWithAuth("GET /user");
  expect(response1.data.id).toEqual(123);
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
    code: "random123",
    state: "mystate123",
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

test("auth.hook(request, 'PATCH /applications/{client_id}/token') resets the used token", async () => {
  const mock = fetchMock
    .sandbox()
    .postOnce("https://github.com/login/oauth/access_token", {
      access_token: "secret123",
      scope: "",
    })
    .getOnce(
      "https://api.github.com/user",
      { id: 123 },
      {
        headers: {
          authorization: "token secret123",
        },
      }
    )
    .patchOnce(
      "https://api.github.com/applications/123/token",
      {
        token: "newsecret123",
      },
      {
        body: {
          access_token: "secret123",
        },
      }
    )
    .getOnce(
      "https://api.github.com/user",
      { id: 123 },
      {
        headers: {
          authorization: "token newsecret123",
        },
        overwriteRoutes: false,
      }
    );

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123",
    state: "mystate123",
  });

  const requestWithAuth = request.defaults({
    request: {
      fetch: mock,
      hook: auth.hook,
    },
  });

  const response1 = await requestWithAuth("GET /user");
  expect(response1.data.id).toEqual(123);

  await requestWithAuth("PATCH /applications/{client_id}/token", {
    client_id: "123",
    access_token: "secret123",
  });

  const response2 = await requestWithAuth("GET /user");
  expect(response2.data.id).toEqual(123);
});

test("oauth endpoint error", async () => {
  const requestMock = request.defaults({
    headers: {
      "user-agent": "test",
    },
    request: {
      fetch: fetchMock
        .sandbox()
        .post("https://github.com/login/oauth/access_token", {
          status: 200,
          body: JSON.stringify({
            error: "incorrect_client_credentials",
            error_description:
              "The client_id and/or client_secret passed are incorrect.",
          }),
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }),
    },
  });

  const auth = createOAuthAppAuth({
    clientId: "12345678901234567890",
    clientSecret: "1234567890123456789012345678901234567890",
    code: "12345678901234567890",
    request: requestMock,
  });

  await expect(auth({ type: "token" })).rejects.toThrow(
    "incorrect_client_credentials"
  );
});
