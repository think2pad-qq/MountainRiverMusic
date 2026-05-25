# Decap Admin OAuth

The admin page at `/admin/#/` uses Decap CMS with the GitHub backend. On GitHub Pages, Decap cannot complete GitHub OAuth by itself, so `public/admin/config.yml` points `backend.base_url` at a Cloudflare Worker OAuth proxy.

If GitHub authorization succeeds but the admin screen stays on the login page, the OAuth proxy is usually not sending Decap's popup handshake back to the opener window.

Decap accepts OAuth popup messages only when `event.origin` exactly equals `backend.base_url`. The callback page must therefore send messages with `window.opener.postMessage(..., '*')`; using the GitHub Pages origin as `targetOrigin` can prevent the opener from receiving the message or make Decap reject it.

## Worker Contract

Decap opens:

```text
https://<worker>/auth?provider=github&site_id=<site>
```

The worker should:

1. Redirect `/auth` to GitHub OAuth.
2. Exchange the GitHub `code` at `/callback`.
3. Render a callback page that posts `authorizing:github` to `window.opener`.
4. Wait for Decap to answer, then post:

```text
authorization:github:success:{"token":"<github-access-token>"}
```

`scripts/decap-oauth-worker.js` contains a minimal Cloudflare Worker implementation for this flow.

## Cloudflare Settings

Set these Worker secrets:

```text
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
SITE_ORIGIN=https://think2pad-qq.github.io
```

In the GitHub OAuth App settings, set the callback URL to:

```text
https://decap-oauth-worker.2308057418.workers.dev/callback
```

After replacing the Worker code, deploy the site and clear the browser cache for:

```text
https://think2pad-qq.github.io/MountainRiverMusic/admin/
```
