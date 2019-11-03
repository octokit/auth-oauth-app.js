import fetchMock, { MockMatcherFunction } from "fetch-mock";
import { request } from "@octokit/request";

import { createOAuthAppAuth } from "../src/index";

test("README example with `url`", async () => {
  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123", // code from OAuth web flow, see https://git.io/fhd1D
    state: "mystate123"
  });

  const authentication = await auth({
    type: "oauth-app",
    url: "/orgs/:org/repos"
  });

  expect(authentication).toEqual({
    type: "oauth-app",
    clientId: "123",
    clientSecret: "secret",
    headers: {},
    query: {
      client_id: "123",
      client_secret: "secret"
    }
  });
});

test("README example with `auth: 'token'`", async () => {
  const matchCreateAccessToken: MockMatcherFunction = (
    url,
    { body, headers }
  ) => {
    expect(url).toEqual("https://github.com/login/oauth/access_token");
    expect(headers).toStrictEqual({
      accept: "application/json",
      "user-agent": "test",
      "content-type": "application/json; charset=utf-8"
    });
    return true;
  };

  const createAccessTokenResponseData = {
    access_token: "secret123",
    scope: "",
    token_type: "bearer"
  };

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123", // code from OAuth web flow, see https://git.io/fhd1D
    state: "mystate123",
    request: request.defaults({
      headers: {
        "user-agent": "test"
      },
      request: {
        fetch: fetchMock
          .sandbox()
          .postOnce(matchCreateAccessToken, createAccessTokenResponseData)
      }
    })
  });

  const authentication = await auth({ type: "token" });

  expect(authentication).toEqual({
    type: "token",
    tokenType: "oauth",
    token: "secret123",
    scopes: []
  });
});

test('`url` is "/applications/:client_id/tokens/:access_token"', async () => {
  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123", // code from OAuth web flow, see https://git.io/fhd1D
    state: "mystate123"
  });

  const authentication = await auth({
    type: "oauth-app",
    url: "/applications/:client_id/tokens/secret123"
  });

  expect(authentication).toEqual({
    type: "oauth-app",
    clientId: "123",
    clientSecret: "secret",
    headers: {
      authorization: "basic MTIzOnNlY3JldA==" // btoa('123:secret')
    },
    query: {}
  });
});

test("`code` with `redirectUrl` and `state`", async () => {
  const matchCreateAccessToken: MockMatcherFunction = (
    url,
    { body, headers }
  ) => {
    expect(url).toEqual("https://github.com/login/oauth/access_token");
    expect(headers).toStrictEqual({
      accept: "application/json",
      "user-agent": "test",
      "content-type": "application/json; charset=utf-8"
    });
    expect(JSON.parse(String(body))).toStrictEqual({
      client_id: "123",
      client_secret: "secret",
      code: "random123",
      redirect_uri: "https://example.com/login",
      state: "mystate123"
    });

    return true;
  };

  const createAccessTokenResponseData = {
    access_token: "secret123",
    scope: "",
    token_type: "bearer"
  };

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123", // code from OAuth web flow, see https://git.io/fhd1D
    state: "mystate123",
    redirectUrl: "https://example.com/login",
    request: request.defaults({
      headers: {
        "user-agent": "test"
      },
      request: {
        fetch: fetchMock
          .sandbox()
          .postOnce(matchCreateAccessToken, createAccessTokenResponseData)
      }
    })
  });

  const authentication = await auth({
    type: "token"
  });

  expect(authentication).toEqual({
    type: "token",
    token: "secret123",
    tokenType: "oauth",
    scopes: []
  });
});

test("test with request instance that has custom baseUrl (GHE)", async () => {
  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123", // code from OAuth web flow, see https://git.io/fhd1D
    state: "mystate123",
    request: request.defaults({
      baseUrl: "https://github.acme-inc.com/api/v3",
      request: {
        fetch: fetchMock
          .sandbox()
          .postOnce("https://github.acme-inc.com/login/oauth/access_token", {
            access_token: "secret123",
            scope: ""
          })
      }
    })
  });

  const authentication = await auth({ type: "token" });

  expect(authentication).toEqual({
    type: "token",
    tokenType: "oauth",
    token: "secret123",
    scopes: []
  });
});

test("auth.hook() creates token and uses it for succeeding requests", async () => {
  const mock = fetchMock
    .sandbox()
    .postOnce("https://github.com/login/oauth/access_token", {
      access_token: "secret123",
      scope: ""
    })
    .get(
      "https://api.github.com/user",
      { id: 123 },
      {
        headers: {
          authorization: "token secret123"
        },
        repeat: 4
      }
    );

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123", // code from OAuth web flow, see https://git.io/fhd1D
    state: "mystate123"
  });

  const requestWithMock = request.defaults({
    request: {
      fetch: mock
    }
  });
  const requestWithAuth = requestWithMock.defaults({
    request: {
      hook: auth.hook
    }
  });

  await auth.hook(requestWithMock, "GET /user");
  await auth.hook(requestWithMock, "GET /user");

  await requestWithAuth("GET /user");
  await requestWithAuth("GET /user");

  expect(mock.done()).toBe(true);
});

test("auth.hook defaults URL parameters for '/applications/:client_id/tokens/:access_token'", async () => {
  const mock = fetchMock
    .sandbox()
    .postOnce("https://github.com/login/oauth/access_token", {
      access_token: "secret123",
      scope: ""
    })
    .getOnce(
      "https://api.github.com/applications/123/tokens/secret123",
      { id: 123 },
      {
        headers: {
          authorization: "basic MTIzOnNlY3JldA==" // btoa('123:secret')
        }
      }
    )
    .getOnce(
      "https://api.github.com/applications/123/tokens/othersecret",
      { id: 456 },
      {
        headers: {
          authorization: "basic MTIzOnNlY3JldA==" // btoa('123:secret')
        }
      }
    )
    .getOnce(
      "https://api.github.com/applications/123/tokens/yetanothersecret",
      { id: 789 },
      {
        headers: {
          authorization: "basic MTIzOnNlY3JldA==" // btoa('123:secret')
        }
      }
    );

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123", // code from OAuth web flow, see https://git.io/fhd1D
    state: "mystate123"
  });

  const requestWithMock = request.defaults({
    request: {
      fetch: mock
    }
  });
  const requestWithAuth = requestWithMock.defaults({
    request: {
      hook: auth.hook
    }
  });

  const { data: data1 } = await requestWithAuth(
    "GET /applications/:client_id/tokens/:access_token"
  );
  const { data: data2 } = await requestWithAuth(
    "GET /applications/:client_id/tokens/:access_token",
    { access_token: "othersecret" }
  );
  const { data: data3 } = await requestWithAuth(
    "GET /applications/123/tokens/yetanothersecret"
  );

  expect(mock.done()).toBe(true);
  expect(data1.id).toBe(123);
  expect(data2.id).toBe(456);
  expect(data3.id).toBe(789);
});

test("auth.hook(request, 'POST /applications/:client_id/tokens/:access_token') resets the used token", async () => {
  const mock = fetchMock
    .sandbox()
    .postOnce("https://github.com/login/oauth/access_token", {
      access_token: "secret123",
      scope: ""
    })
    .getOnce(
      "https://api.github.com/user",
      { id: 123 },
      {
        headers: {
          authorization: "token secret123" // btoa('123:secret')
        }
      }
    )
    .postOnce("https://api.github.com/applications/123/tokens/secret123", {
      token: "newsecret123"
    })
    .getOnce(
      "https://api.github.com/user",
      { id: 123 },
      {
        headers: {
          authorization: "token newsecret123" // btoa('123:secret')
        },
        overwriteRoutes: false
      }
    );

  const auth = createOAuthAppAuth({
    clientId: "123",
    clientSecret: "secret",
    code: "random123", // code from OAuth web flow, see https://git.io/fhd1D
    state: "mystate123"
  });

  const requestWithAuth = request.defaults({
    request: {
      fetch: mock,
      hook: auth.hook
    }
  });

  const response1 = await requestWithAuth("GET /user");
  expect(response1.data).toStrictEqual({ id: 123 });

  await requestWithAuth("POST /applications/:client_id/tokens/:access_token");
  const response2 = await requestWithAuth("GET /user");
  expect(response2.data).toStrictEqual({ id: 123 });
});

test("oauth endpoint error", async () => {
  const requestMock = request.defaults({
    headers: {
      "user-agent": "test"
    },
    request: {
      fetch: fetchMock.sandbox().post(
        "https://github.com/login/oauth/access_token", {
          status: 200,
          body: JSON.stringify({
            error: "incorrect_client_credentials",
            error_description: "The client_id and/or client_secret passed are incorrect.",
          }),
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          }
        }),
    },
  });

  const auth = createOAuthAppAuth({
    clientId: "12345678901234567890",
    clientSecret: "1234567890123456789012345678901234567890",
    code: "12345678901234567890",
    request: requestMock,
  });

  await expect(
    auth({ type: 'token' })
  ).rejects.toThrow('incorrect_client_credentials');
});
