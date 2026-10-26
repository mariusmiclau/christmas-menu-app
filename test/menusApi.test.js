import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/menus.js';
import { ADMIN_COOKIE_NAME, createAdminToken } from '../api/_adminAuth.js';
import { DEFAULT_MENU } from '../src/menuData.js';

function responseRecorder() {
  return {
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('public reads return the menu selected in shared storage', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ status: 'success', menus: [DEFAULT_MENU], activeMenuId: DEFAULT_MENU.id }));
  const response = responseRecorder();
  await handler({ method: 'GET' }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.activeMenuId, DEFAULT_MENU.id);
  assert.equal(response.body.menus[0].mains[1].name, 'Oven Baked Salmon');
});

test('an old script never claims shared storage is working', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('Google Apps Script is working!'));
  const response = responseRecorder();
  await handler({ method: 'GET' }, response);
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.available, false);
});

test('menu writes require admin login and the server-side secret', async (t) => {
  const previous = {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    MENU_WRITE_SECRET: process.env.MENU_WRITE_SECRET,
  };
  t.after(() => Object.entries(previous).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }));
  process.env.ADMIN_PASSWORD = 'test-password-123456';
  process.env.ADMIN_SESSION_SECRET = 'session-secret-of-at-least-32-characters';
  process.env.MENU_WRITE_SECRET = 'menu-write-secret-of-at-least-32-characters';
  const token = createAdminToken(process.env.ADMIN_SESSION_SECRET);
  const headers = { cookie: `${ADMIN_COOKIE_NAME}=${token}` };
  let writes = 0;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    writes += 1;
    const body = JSON.parse(options.body);
    assert.equal(body.secret, process.env.MENU_WRITE_SECRET);
    assert.equal(body.menu.id, DEFAULT_MENU.id);
    return Response.json({ status: 'success', menuId: body.menu.id, activeMenuId: body.action === 'publishMenu' ? body.menu.id : 'fv-christmas-2025' });
  });

  const denied = responseRecorder();
  await handler({ method: 'POST', headers: {}, body: { action: 'publishMenu', menu: DEFAULT_MENU } }, denied);
  assert.equal(denied.statusCode, 401);
  assert.equal(writes, 0);

  const saved = responseRecorder();
  await handler({ method: 'POST', headers, body: { action: 'saveMenu', menu: DEFAULT_MENU } }, saved);
  assert.equal(saved.statusCode, 200);
  assert.equal(saved.body.activeMenuId, 'fv-christmas-2025');

  const published = responseRecorder();
  await handler({ method: 'POST', headers, body: { action: 'publishMenu', menu: DEFAULT_MENU } }, published);
  assert.equal(published.statusCode, 200);
  assert.equal(published.body.activeMenuId, DEFAULT_MENU.id);
  assert.equal(writes, 2);

  const malformed = responseRecorder();
  await handler({ method: 'POST', headers, body: { action: 'saveMenu', menu: { ...DEFAULT_MENU, mains: [] } } }, malformed);
  assert.equal(malformed.statusCode, 400);
  assert.equal(writes, 2);
});

test('published menu cannot be deleted through a stale admin page', async (t) => {
  const previous = {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    MENU_WRITE_SECRET: process.env.MENU_WRITE_SECRET,
  };
  t.after(() => Object.entries(previous).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }));
  process.env.ADMIN_PASSWORD = 'test-password-123456';
  process.env.ADMIN_SESSION_SECRET = 'session-secret-of-at-least-32-characters';
  process.env.MENU_WRITE_SECRET = 'menu-write-secret-of-at-least-32-characters';
  const token = createAdminToken(process.env.ADMIN_SESSION_SECRET);
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    calls += 1;
    assert.equal(options?.method, undefined, 'published-menu check is read only');
    return Response.json({ status: 'success', menus: [DEFAULT_MENU], activeMenuId: DEFAULT_MENU.id });
  });
  const response = responseRecorder();
  await handler({ method: 'POST', headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` }, body: { action: 'saveMenu', menu: { ...DEFAULT_MENU, deleted: true } } }, response);
  assert.equal(response.statusCode, 409);
  assert.equal(calls, 1);
});
