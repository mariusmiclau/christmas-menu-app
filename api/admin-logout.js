import { adminSessionCookie, sendJson } from './_adminAuth.js';

export default function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  response.setHeader('Set-Cookie', adminSessionCookie('', request, 0));
  return sendJson(response, 200, { authenticated: false });
}
