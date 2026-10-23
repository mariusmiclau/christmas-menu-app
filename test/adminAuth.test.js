import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAdminToken,
  credentialsMatch,
  parseCookies,
  verifyAdminToken,
} from '../api/_adminAuth.js';

test('admin session tokens are signed and expire', () => {
  const now = 1_000_000;
  const token = createAdminToken('a-long-session-secret-for-testing', now, 5_000);

  assert.equal(verifyAdminToken(token, 'a-long-session-secret-for-testing', now + 4_999), true);
  assert.equal(verifyAdminToken(token, 'the-wrong-secret', now + 1), false);
  assert.equal(verifyAdminToken(token, 'a-long-session-secret-for-testing', now + 5_000), false);
});

test('admin credentials only match a configured account', () => {
  const configured = {
    configured: true,
    username: 'admin',
    password: 'correct horse battery staple',
  };

  assert.equal(credentialsMatch('admin', 'correct horse battery staple', configured), true);
  assert.equal(credentialsMatch('admin', 'wrong password', configured), false);
  assert.equal(credentialsMatch('admin', 'correct horse battery staple', { ...configured, configured: false }), false);
});

test('cookie parsing preserves encoded values', () => {
  assert.deepEqual(parseCookies('theme=dark; christmas_menu_admin=abc%2E123'), {
    theme: 'dark',
    christmas_menu_admin: 'abc.123',
  });
});
