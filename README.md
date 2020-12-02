# auth-oauth-app.js

> GitHub OAuth App authentication for JavaScript

[![@latest](https://img.shields.io/npm/v/@octokit/auth-oauth-app.svg)](https://www.npmjs.com/package/@octokit/auth-oauth-app)
[![Build Status](https://github.com/octokit/auth-oauth-app.js/workflows/Test/badge.svg)](https://github.com/octokit/auth-oauth-app.js/actions?query=workflow%3ATest)

`@octokit/auth-oauth-app` is implementing one of [GitHub’s authentication strategies](https://github.com/octokit/auth.js).

It implements authentication using an OAuth app’s client ID and secret as well as OAuth access tokens in exchange for a `code` from the [web application flow](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#web-application-flow).

<!-- toc -->

- [Usage](#usage)
- [`createOAuthAppAuth(options)`](#createoauthappauthoptions)
- [`auth()`](#auth)
- [Authentication object](#authentication-object)
    - [OAuth authentication](#oauth-authentication)
    - [OAuth access token authentication](#oauth-access-token-authentication)
- [`auth.hook(request, route, parameters)` or `auth.hook(request, options)`](#authhookrequest-route-parameters-or-authhookrequest-options)
- [Implementation details](#implementation-details)
- [License](#license)

<!-- tocstop -->

## Usage

<table>
<tbody valign=top align=left>
<tr><th>
Browsers
</th><td width=100%>

Load `@octokit/auth-oauth-app` directly from [cdn.skypack.dev](https://cdn.skypack.dev)

```html
<script type="module">
  import { createOAuthAppAuth } from "https://cdn.skypack.dev/@octokit/auth-oauth-app";
</script>
```

</td></tr>
<tr><th>
Node
</th><td>

Install with <code>npm install @octokit/auth-oauth-app</code>

```js
const { createOAuthAppAuth } = require("@octokit/auth-oauth-app");
// or: import { createOAuthAppAuth } from "@octokit/auth-oauth-app";
```

</td></tr>
</tbody>
</table>

```js
const auth = createOAuthAppAuth({
  clientId: "123",
  clientSecret: "secret",
});

// OAuth Apps authenticate using Basic auth, where
// username is clientId and password is clientSecret
const appAuthentication = await auth({
  type: "oauth-app",
});
// resolves with
// {
//   type: 'oauth-app',
//   clientId: '123',
//   clientSecret: 'secret',
//   headers: {
//     authorization: 'basic MTIzOnNlY3JldA=='
//   }
// }

const tokenAuthentication = await auth({
  type: "token",
  code: "random123", // code from OAuth web flow, see https://git.io/fhd1D
  state: "mystate123",
});
// resolves with
// {
//   type: 'token',
//   tokenType: 'oauth',
//   token: '...', /* the created oauth token */
//   scopes: [] /* depend on request scopes by OAuth app */
// }
```

## `createOAuthAppAuth(options)`

The `createOAuthAppAuth` method accepts a single `options` parameter

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>options.clientId</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>. Find your OAuth app’s <code>Client ID</code> in your account’s developer settings.
      </td>
    </tr>
    <tr>
      <th>
        <code>options.clientSecret</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required</strong>. Find your OAuth app’s <code>Client Secret</code> in your account’s developer settings.
      </td>
    </tr>
    <tr>
      <th>
        <code>options.code</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The authorization <code>code</code> which was passed as query parameter to the callback URL from the <a href="https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#2-users-are-redirected-back-to-your-site-by-github">OAuth web application flow</a>.
      </td>
    </tr>
    <tr>
      <th>
        <code>options.redirectUrl</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The URL in your application where users are sent after authorization. See <a href="https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#redirect-urls">redirect urls</a>.
      </td>
    </tr>
    <tr>
      <th>
        <code>options.state</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The unguessable random string you provided in Step 1 of the <a href="https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#2-users-are-redirected-back-to-your-site-by-github">OAuth web application flow</a>.
      </td>
    </tr>
    <tr>
      <th>
        <code>options.request</code>
      </th>
      <th>
        <code>function</code>
      </th>
      <td>
        You can pass in your own <a href="https://github.com/octokit/request.js"><code>@octokit/request</code></a> instance. For usage with enterprise, set <code>baseUrl</code> to the API root endpoint. Example:

```js
const { request } = require("@octokit/request");
createOAuthAppAuth({
  clientId: 123,
  clientSecret: "secret",
  request: request.defaults({
    baseUrl: "https://ghe.my-company.com/api/v3",
  }),
});
```

</td></tr>
  </tbody>
</table>

## `auth()`

The async `auth()` method returned by `createOAuthAppAuth(options)` accepts the following options

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>options.type</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <strong>Required.</strong> Either <code>"oauth-app"</code> or <code>"token"</code>.
      </td>
    </tr>
    <tr>
      <th>
        <code>options.code</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        Only relevant if <code>options.type</code> is set to <code>"token"</code>. The authorization <code>code</code> which was passed as query parameter to the callback URL from the <a href="https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#2-users-are-redirected-back-to-your-site-by-github">OAuth web application flow</a>. Defaults to what was set in the strategy options.
      </td>
    </tr>
    <tr>
      <th>
        <code>options.redirectUrl</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        Only relevant if <code>options.type</code> is set to <code>"token"</code>. The URL in your application where users are sent after authorization. See <a href="https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#redirect-urls">redirect urls</a>. Defaults to what was set in the strategy options.
      </td>
    </tr>
    <tr>
      <th>
        <code>options.state</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        Only relevant if <code>options.type</code> is set to <code>"token"</code>. The unguessable random string you provided in Step 1 of the <a href="https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#2-users-are-redirected-back-to-your-site-by-github">OAuth web application flow</a>. Defaults to what was set in the strategy options.
      </td>
    </tr>
  </tbody>
</table>

## Authentication object

The async `auth(options)` method to one of two possible authentication objects

1. **OAuth authentication** if `clientId` and `clientSecret` options were passed.
2. **OAuth access token authentication** if `code` option was passed.

#### OAuth authentication

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>type</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <code>"oauth-app"</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>clientId</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The client ID as passed to the constructor.
      </td>
    </tr>
    <tr>
      <th>
        <code>clientSecret</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The client secret as passed to the constructor.
      </td>
    </tr>
    <tr>
      <th>
        <code>headers</code>
      </th>
      <th>
        <code>object</code>
      </th>
      <td>
        <code>{ authorization }</code>.
      </td>
    </tr>
  </tbody>
</table>

#### OAuth access token authentication

<table width="100%">
  <thead align=left>
    <tr>
      <th width=150>
        name
      </th>
      <th width=70>
        type
      </th>
      <th>
        description
      </th>
    </tr>
  </thead>
  <tbody align=left valign=top>
    <tr>
      <th>
        <code>type</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <code>"token"</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>token</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The personal access token
      </td>
    </tr>
    <tr>
      <th>
        <code>tokenType</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        <code>"oauth"</code>
      </td>
    </tr>
    <tr>
      <th>
        <code>scopes</code>
      </th>
      <th>
        <code>array of strings</code>
      </th>
      <td>
        array of scope names enabled for the token
      </td>
    </tr>
  </tbody>
</table>

## `auth.hook(request, route, parameters)` or `auth.hook(request, options)`

`auth.hook()` hooks directly into the request life cycle. It amends the request to authenticate correctly based on the request URL.

The `request` option is an instance of [`@octokit/request`](https://github.com/octokit/request.js#readme). The `route`/`options` parameters are the same as for the [`request()` method](https://github.com/octokit/request.js#request).

`auth.hook()` can be called directly to send an authenticated request

```js
const { data: user } = await auth.hook(request, "GET /user");
```

Or it can be passed as option to [`request()`](https://github.com/octokit/request.js#request).

```js
const requestWithAuth = request.defaults({
  request: {
    hook: auth.hook,
  },
});

const { data: user } = await requestWithAuth("GET /user");
```

## Implementation details

Client ID and secret can be passed as Basic auth in the `Authorization` header in order to get a higher rate limit compared to unauthenticated requests. This is meant for the use on servers only: never expose an OAuth client secret on a client such as a web application!

`auth.hook` will set the correct authentication header automatically based on the request URL. For all [OAuth Application endpoints](https://developer.github.com/v3/apps/oauth_applications/), the `Authorization` header is set to basic auth. For all other endpoints and token is retrieved and used in the `Authorization` header. The token is cached and used for succeeding requsets.

To reset the cached access token, you can do this

```js
const { token } = await auth({ type: "token" });
await auth.hook(request, "POST /applications/{client_id}/token", {
  client_id: "123",
  access_token: token,
});
```

The internally cached token will be replaced and used for succeeding requests. See also ["the REST API documentation"](https://developer.github.com/v3/oauth_authorizations/).

See also: [octokit/oauth-authorization-url.js](https://github.com/octokit/oauth-authorization-url.js).

## License

[MIT](LICENSE)
