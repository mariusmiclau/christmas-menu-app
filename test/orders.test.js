import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/orders.js';
import { saveOrder } from '../src/ordersApi.js';

const row = ['Test guest', 2, 'starter-1', 'main-1', '', 'Medium', '2026-10-23', 'menu-2026', 'Christmas dinner'];

function responseRecorder() {
  return {
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('only a confirmed Google append produces a successful website submission', async (t) => {
  const originalFetch = globalThis.fetch;
  for (const [label, upstream, expected] of [
    ['saved', () => Response.json({ status: 'success' }), true],
    ['forbidden', () => new Response('Forbidden', { status: 403 }), false],
    ['script error', () => Response.json({ status: 'error', message: 'Sheet not found' }), false],
    ['login page', () => new Response('<html>Sign in</html>'), false],
    ['timeout', () => { throw new Error('Timeout'); }, false],
  ]) {
    await t.test(label, async (t) => {
      let upstreamCalls = 0;
      t.mock.method(globalThis, 'fetch', async (url, options) => {
        if (url === '/api/orders') {
          const captured = responseRecorder();
          await handler({ method: 'POST', body: JSON.parse(options.body) }, captured);
          return Response.json(captured.body, { status: captured.statusCode });
        }
        upstreamCalls += 1;
        const payload = JSON.parse(options.body);
        assert.equal(payload.sheetName, 'Orders');
        assert.deepEqual(payload.values, [row]);
        return upstream();
      });
      if (expected) await saveOrder(row);
      else await assert.rejects(saveOrder(row));
      assert.equal(upstreamCalls, 1, 'never retry an append automatically');
    });
  }
  assert.equal(globalThis.fetch, originalFetch);
});

test('invalid submissions never reach Google', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', () => { throw new Error('Must not write'); });
  const response = responseRecorder();
  await handler({ method: 'POST', body: { row: [] } }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(fetchMock.mock.callCount(), 0);
});
