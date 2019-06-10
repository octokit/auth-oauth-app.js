# auth-oauth-app.js

> OAuth App authentication for JavaScript

`@octokit/auth-oauth-app` is implementing one of [GitHub’s authentication strategies](https://github.com/octokit/auth.js).

It implements authentication using an OAuth app’s client ID and secret. This is meant for the use on servers only: never expose an OAuth client secret on a client such as a web application!

Client ID and secret can be passed as URL query parameters (`?client_id=...&client_secret=...`) to get a higher rate limit compared to unauthenticated requests.

The only exceptions are

- [`GET /applications/:client_id/tokens/:access_token`](https://developer.github.com/v3/oauth_authorizations/#check-an-authorization) - Check an authorization
- [`POST /applications/:client_id/tokens/:access_token`](https://developer.github.com/v3/oauth_authorizations/#reset-an-authorization) - Reset an authorization
- [`DELETE /applications/:client_id/tokens/:access_token`](https://developer.github.com/v3/oauth_authorizations/#revoke-an-authorization-for-an-application) - Revoke an authorization for an application

For these endpoints, client ID and secret need to be passed as basic authentication in the `Authorization` header. Because of these exception an `options.url` parameter must be passed to the async `auth()` function.

See also: [octokit/oauth-login-url.js](https://github.com/octokit/oauth-login-url.js).

## Usage

```js
import { createOAuthAppAuth } from "@octokit/auth-oauth-app";
import { request } from "@octokit/request";

(async () => {
  const auth = createOAuthAppAuth({
    clientId,
    clientSecret
  });

  // Request private repos for "octokit" org using client ID/secret authentication
  const appAuthentication = await auth({ url: "/orgs/:org/repos" });
  const result = await request("GET /orgs/:org/repos", {
    org: "octokit",
    type: "private",
    headers: appAuthentication.headers,
    ...appAuthentication.query
  });

  // Request private repos for "octokit" org using OAuth token authentication
  // "random123" is the authorization code from the web application flow, see below
  const tokenAuthentication = await auth({ code: "random123" });
  const result = await request("GET /orgs/:org/repos", {
    org: "octokit",
    type: "private",
    headers: tokenAuthentication.headers
  });
})();
```

## `createOAuthAppAuth(options)`

The `createOAuthAppAuth` method accepts a single parameter with two keys

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
        <code>options.request</code>
      </th>
      <th>
        <code>function</code>
      </th>
      <td>
        You can pass in your own <a href="https://github.com/octokit/request.js"><code>@octokit/request</code></a> instance. For usage with enterprise, set <code>baseUrl</code> to the hostname. Example:

```js
const { request } = require("@octokit/request");
createOAuthAppAuth({
  clientId: 123,
  clientSecret: "secret",
  request: request.defaults({
    baseUrl: "https://ghe.my-company.com"
  })
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
        <code>url</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        An absolute URL or endpoint route path. Examples:
        <ul>
          <li><code>"https://enterprise.github.com/api/v3/applications/1234567890abcdef1234/tokens/secret123"</code></li>
          <li><code>"/applications/1234567890abcdef1234/tokens/secret123"</code></li>
          <li><code>"/applications/:client_id/tokens/:access_token"</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <th>
        <code>code</code>
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
        <code>redirectUrl</code>
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
        <code>state</code>
      </th>
      <th>
        <code>string</code>
      </th>
      <td>
        The unguessable random string you provided in Step 1 of the <a href="https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#2-users-are-redirected-back-to-your-site-by-github">OAuth web application flow</a>.
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
        <code>{}</code> if no <code>url</code> option was passed or the passed <code>url</code> option <em>does not</em> match <code>/applications/:client_id/tokens/:access_token</code>.<br>
        <br>
        <code>{ authorization }</code> if the passed <code>url</code> option <em>does</em> match <code>/applications/:client_id/tokens/:access_token</code>.
      </td>
    </tr>
    <tr>
      <th>
        <code>query</code>
      </th>
      <th>
        <code>object</code>
      </th>
      <td>
        <code>{ client_id, client_secret }</code> if no <code>url</code> option was passed or the passed <code>url</code> option <em>does not</em> match <code>/applications/:client_id/tokens/:access_token</code>.<br>
        <br>
        <code>{}</code> if the passed <code>url</code> option <em>does</em> match <code>/applications/:client_id/tokens/:access_token</code>.
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
    <tr>
      <th>
        <code>headers</code>
      </th>
      <th>
        <code>object</code>
      </th>
      <td>
        <code>{ authorization }</code> - value for the "Authorization" header
      </td>
    </tr>
    <tr>
      <th>
        <code>query</code>
      </th>
      <th>
        <code>object</code>
      </th>
      <td>
        <code>{}</code> - not used
      </td>
    </tr>
  </tbody>
</table>

## License

[MIT](LICENSE)
