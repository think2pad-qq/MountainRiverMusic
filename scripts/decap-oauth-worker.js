const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      return authorize(url, env);
    }

    if (url.pathname === '/callback') {
      return callback(url, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

function authorize(url, env) {
  const provider = url.searchParams.get('provider') || 'github';
  const scope = url.searchParams.get('scope') || 'repo,user';
  const siteId = url.searchParams.get('site_id') || '';
  const origin = url.searchParams.get('origin') || env.SITE_ORIGIN || normalizeSiteOrigin(siteId);

  if (provider !== 'github') {
    return new Response('Unsupported provider', { status: 400 });
  }

  const state = btoa(JSON.stringify({ origin }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const authUrl = new URL(GITHUB_AUTHORIZE_URL);
  authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', new URL('/callback', url.origin).toString());
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);

  return Response.redirect(authUrl.toString(), 302);
}

async function callback(url, env) {
  const code = url.searchParams.get('code');
  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': 'MountainRiverMusic Decap OAuth Worker',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: new URL('/callback', url.origin).toString(),
    }),
  });

  const tokenPayload = await tokenResponse.json();

  if (!tokenPayload.access_token) {
    return json(tokenPayload, tokenResponse.status || 502);
  }

  return new Response(renderCallbackPage(tokenPayload.access_token), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer',
    },
  });
}

function normalizeSiteOrigin(siteId) {
  if (!siteId) {
    return '';
  }

  if (siteId.startsWith('http://') || siteId.startsWith('https://')) {
    return siteId;
  }

  return `https://${siteId}`;
}

function renderCallbackPage(token) {
  const message = `authorization:github:success:${JSON.stringify({ token })}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Authorized</title>
</head>
<body>
  <script>
    (function () {
      var message = ${JSON.stringify(message)};

      function sendAuthorization(event) {
        window.opener.postMessage(message, '*');
      }

      if (window.opener) {
        window.addEventListener('message', sendAuthorization, false);
        window.opener.postMessage('authorizing:github', '*');
        window.setTimeout(function () {
          window.opener.postMessage(message, '*');
        }, 1000);
      }
    })();
  </script>
  <p>Authorization complete. You can close this window.</p>
</body>
</html>`;
}

function json(value, status) {
  return new Response(JSON.stringify(value, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
