import { adminAuthConfig, requestHasAdminSession, sendJson } from './_adminAuth.js';

export default function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  const config = adminAuthConfig();
  return sendJson(response, 200, {
    authenticated: requestHasAdminSession(request, config),
    configured: config.configured,
  });
}
