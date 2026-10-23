async function readResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Admin access could not be verified.');
  return body;
}

export async function getAdminSession() {
  const response = await fetch('/api/admin-session', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  return readResponse(response);
}

export async function loginAsAdmin(username, password) {
  const response = await fetch('/api/admin-login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return readResponse(response);
}

export async function logoutAdmin() {
  const response = await fetch('/api/admin-logout', {
    method: 'POST',
    credentials: 'same-origin',
  });
  return readResponse(response);
}
