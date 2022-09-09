import fetchMock, { MockMatcherFunction } from "fetch-mock";
import { request } from "@octokit/request";
import { Octokit } from "@octokit/core";

import { createOAuthAppAuth, createOAuthUserAuth } from "../src/index";

test("README example with {type: 'oauth-app'}", async () => {
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
    clientType: "oauth-app",
    headers: {
      authorization: "basic MTIzOnNlY3JldA==", // btoa('123:secret')
    },
  });
});

test("README web flow example", async () => {
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
  });

  expect(authentication).toEqual({
    clientId: "123",
    clientSecret: "secret",
    clientType: "oauth-app",
    type: "token",
    tokenType: "oauth",
    token: "secret123",
    scopes: [],
  });
});

test("README device flow example", async () => {
  const mock = fetchMock
    .sandbox()

    .postOnce(
      "https://github.com/login/device/code",
      {
        device_code: "devicecode123",
        user_code: "usercode123",
        verification_uri: "https://github.com/login/device",
        expires_in: 900,
        // use low number because jest.useFakeTimers() & jest.runAllTimers() didn't work for me
        interval: 0.005,
      },
      {
        headers: {
          accept: "application/json",
          "user-agent": "test",
          "content-type": "application/json; charset=utf-8",
        },
        body: {
          client_id: "1234567890abcdef1234",
          scope: "",
        },
      }
    )
    .postOnce(
      "https://github.com/login/oauth/access_token",
      {
        access_token: "token123",
        scope: "",
      },
      {
        headers: {
          accept: "application/json",
          "user-agent": "test",
          "content-type": "application/json; charset=utf-8",
        },
        body: {
          client_id: "1234567890abcdef1234",
          device_code: "devicecode123",
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        },
        overwriteRoutes: false,
      }
    );

  const auth = createOAuthAppAuth({
    clientId: "1234567890abcdef1234",
    clientSecret: "secret",
    // pass request mock for testing
    request: request.defaults({
      headers: {
        "user-agent": "test",
      },
      request: {
        fetch: mock,
      },
    }),
  });

  const onVerification = jest.fn();
  const authentication = await auth({
    type: "oauth-user",
    onVerification,
  });

  expect(authentication).toEqual({
    type: "token",
    tokenType: "oauth",
    clientType: "oauth-app",
    clientId: "1234567890abcdef1234",
    clientSecret: "secret",
    token: "token123",
    scopes: [],
  });

  expect(onVerification).toHaveBeenCalledWith({
    device_code: "devicecode123",
    expires_in: 900,
    interval: 0.005,
    user_code: "usercode123",
    verification_uri: "https://github.com/login/device",
  });
});

test("device flow with scopes", async () => {
  const mock = fetchMock
    .sandbox()

    .postOnce(
      "https://github.com/login/device/code",
      {
        device_code: "devicecode123",
        user_code: "usercode123",
        verification_uri: "https://github.com/login/device",
        expires_in: 900,
        // use low number because jest.useFakeTimers() & jest.runAllTimers() didn't work for me
        interval: 0.005,
      },
      {
        headers: {
          accept: "application/json",
          "user-agent": "test",
          "content-type": "application/json; charset=utf-8",
        },
        body: {
          client_id: "1234567890abcdef1234",
          scope: "repo gist",
        },
      }
    )
    .postOnce(
      "https://github.com/login/oauth/access_token",
      {
        access_token: "token123",
        scope: "repo gist",
      },
      {
        headers: {
          accept: "application/json",
          "user-agent": "test",
          "content-type": "application/json; charset=utf-8",
        },
        body: {
          client_id: "1234567890abcdef1234",
          device_code: "devicecode123",
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        },
        overwriteRoutes: false,
      }
    );

  const auth = createOAuthAppAuth({
    clientId: "1234567890abcdef1234",
    clientSecret: "secret",
    // pass request mock for testing
    request: request.defaults({
      headers: {
        "user-agent": "test",
      },
      request: {
        fetch: mock,
      },
    }),
  });

  const onVerification = jest.fn();
  const authentication = await auth({
    type: "oauth-user",
    scopes: ["repo", "gist"],
    onVerification,
  });

  expect(authentication).toEqual({
    type: "token",
    tokenType: "oauth",
    clientType: "oauth-app",
    clientId: "1234567890abcdef1234",
    clientSecret: "secret",
    token: "token123",
    scopes: ["repo", "gist"],
  });

  expect(onVerification).toHaveBeenCalledWith({
    device_code: "devicecode123",
    expires_in: 900,
    interval: 0.005,
    user_code: "usercode123",
    verification_uri: "https://github.com/login/device",
  });
});

test("README Octokit usage example", async () => {
  const matchGetUserRequest: MockMatcherFunction = (url, options) => {
    expect(url).toEqual("https://api.github.com/user");
    expect(options.headers).toEqual(
      expect.objectContaining({
        accept: "application/vnd.github.v3+json",
        authorization: "token token123",
      })
    );

    return true;
  };

  const mock = fetchMock
    .sandbox()

    .postOnce(
      "https://api.github.com/applications/1234567890abcdef1234/token",
      { ok: true },
      {
        body: {
          access_token: "existingtoken123",
        },
      }
    )

    .postOnce(
      "https://github.com/login/oauth/access_token",
      {
        access_token: "token123",
        scope: "",
      },
      {
        body: {
          client_id: "1234567890abcdef1234",
          client_secret: "1234567890abcdef1234567890abcdef12345678",
          code: "code123",
        },
      }
    )

    .getOnce(matchGetUserRequest, {
      login: "octocat",
    });

  const appOctokit = new Octokit({
    authStrategy: createOAuthAppAuth,
    auth: {
      clientId: "1234567890abcdef1234",
      clientSecret: "1234567890abcdef1234567890abcdef12345678",
    },
    userAgent: "test",
    request: {
      fetch: mock,
    },
  });

  // Send requests as app
  const { data } = await appOctokit.request(
    "POST /applications/{client_id}/token",
    {
      client_id: "1234567890abcdef1234",
      access_token: "existingtoken123",
    }
  );
  expect(data).toEqual({ ok: true });

  // create a new octokit instance that is authenticated as the user
  const userOctokit = (await appOctokit.auth({
    type: "oauth-user",
    code: "code123",
    factory: (options: any) => {
      return new Octokit({
        authStrategy: createOAuthUserAuth,
        auth: options,
        userAgent: "test",
        request: {
          fetch: mock,
        },
      });
    },
  })) as Octokit;

  // Exchanges the code for the user access token authentication on first request
  // and caches the authentication for successive requests
  const {
    data: { login },
  } = await userOctokit.request("GET /user");
  expect(login).toEqual("octocat");
});

test("GitHub App", async () => {
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
        client_id: "lv1.1234567890abcdef",
        client_secret: "1234567890abcdef1234567890abcdef12345678",
        code: "random123",
      },
    }
  );

  const auth = createOAuthAppAuth({
    clientId: "lv1.1234567890abcdef",
    clientSecret: "1234567890abcdef1234567890abcdef12345678",
    clientType: "github-app",
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
    clientId: "lv1.1234567890abcdef",
    clientSecret: "1234567890abcdef1234567890abcdef12345678",
    clientType: "github-app",
    type: "token",
    tokenType: "oauth",
    token: "secret123",
  });
});

test("`factory` auth option", async () => {
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
        client_id: "1234567890abcdef1234",
        client_secret: "1234567890abcdef1234567890abcdef12345678",
        code: "random123",
      },
    }
  );

  const appAuth = createOAuthAppAuth({
    clientType: "oauth-app",
    clientId: "1234567890abcdef1234",
    clientSecret: "1234567890abcdef1234567890abcdef12345678",
    request: request.defaults({
      headers: {
        "user-agent": "test",
      },
      request: {
        fetch: mock,
      },
    }),
  });

  const userAuth = await appAuth({
    type: "oauth-user",
    code: "random123",
    factory: (options) => createOAuthUserAuth(options),
  });

  const authentication = await userAuth();

  expect(authentication).toEqual({
    clientId: "1234567890abcdef1234",
    clientSecret: "1234567890abcdef1234567890abcdef12345678",
    clientType: "oauth-app",
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
    {
      "clientId": "123",
      "clientSecret": "secret",
      "clientType": "oauth-app",
      "scopes": [],
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
    "POST /applications/{client_id}/token",
    {
      client_id: "123",
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
  const mock = fetchMock.sandbox().getOnce("https://api.github.com/user", {
    status: 401,
  });

  const auth = createOAuthAppAuth({
    clientId: "12345678901234567890",
    clientSecret: "1234567890123456789012345678901234567890",
  });

  const requestWithAuth = request.defaults({
    request: {
      fetch: mock,
      hook: auth.hook,
    },
  });

  await expect(async () => requestWithAuth("GET /user")).rejects.toThrow(
    '[@octokit/auth-oauth-app] "GET /user" does not support clientId/clientSecret basic authentication'
  );
});

test("auth.hook(request, 'GET /repos/{owner}/{repo})", async () => {
  const mock = fetchMock
    .sandbox()
    .getOnce("https://api.github.com/repos/octokit/octokit.js", {
      ok: true,
    });

  const auth = createOAuthAppAuth({
    clientId: "12345678901234567890",
    clientSecret: "1234567890123456789012345678901234567890",
  });

  const requestWithAuth = request.defaults({
    request: {
      fetch: mock,
      hook: auth.hook,
    },
  });

  const { data } = await requestWithAuth("GET /repos/{owner}/{repo}", {
    owner: "octokit",
    repo: "octokit.js",
  });
  expect(data).toStrictEqual({ ok: true });
});

test("auth.hook(request, 'GET /repos/{owner}/{repo}) as GitHub App", async () => {
  const mock = fetchMock
    .sandbox()
    .getOnce("https://api.github.com/repos/octokit/octokit.js", {
      ok: true,
    });

  const auth = createOAuthAppAuth({
    clientType: "github-app",
    clientId: "lv1.1234567890abcdef",
    clientSecret: "1234567890abcdef1234567890abcdef12345678",
  });

  const requestWithAuth = request.defaults({
    request: {
      fetch: mock,
      hook: auth.hook,
    },
  });

  await expect(async () =>
    requestWithAuth("GET /repos/{owner}/{repo}")
  ).rejects.toThrow(
    '[@octokit/auth-oauth-app] GitHub Apps cannot use their client ID/secret for basic authentication for endpoints other than "/applications/{client_id}/**". "GET /repos/{owner}/{repo}" is not supported.'
  );
});
