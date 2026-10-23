import {
  adminAuthConfig,
  adminSessionCookie,
  createAdminToken,
  credentialsMatch,
  sendJson,
} from './_adminAuth.js';

export default function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  const config = adminAuthConfig();
  if (!config.configured) {
    return sendJson(response, 503, {
      error: 'Admin login is not configured. Add the required environment variables in Vercel.',
    });
  }

  const { username = '', password = '' } = request.body || {};
  if (!credentialsMatch(username, password, config)) {
    return sendJson(response, 401, { error: 'The admin username or password is incorrect.' });
  }

  const token = createAdminToken(config.sessionSecret);
  response.setHeader('Set-Cookie', adminSessionCookie(token, request));
  return sendJson(response, 200, { authenticated: true, username: config.username });
}
