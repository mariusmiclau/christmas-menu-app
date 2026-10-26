export async function loadSharedMenus() {
  const response = await fetch('/api/menus', { cache: 'no-store' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.available !== true) throw new Error(body.error || 'Shared menus are unavailable.');
  return body;
}

export async function writeSharedMenu(action, menu) {
  const response = await fetch('/api/menus', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, menu }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.saved !== true) throw new Error(body.error || 'Google did not confirm the menu update.');
  return body;
}
