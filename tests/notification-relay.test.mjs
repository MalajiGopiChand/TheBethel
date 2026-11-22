import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

function harness({ prepareFails = false, enabled = true } = {}) {
  const calls = [], warnings = [], storage = new Map();
  const source = transformSync(readFileSync(new URL('../src/services/notificationRelay.js', import.meta.url), 'utf8'), {
    format: 'cjs', define: { 'import.meta.env.VITE_NOTIFICATION_BACKEND': JSON.stringify(enabled ? 'vercel' : '') },
  }).code;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, AbortController, setTimeout, clearTimeout,
    require: () => ({ auth: { currentUser: { uid: 'u', getIdToken: async () => 'test-token' } } }),
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    window: { dispatchEvent: event => warnings.push(event.detail) },
    CustomEvent: class { constructor(_, options) { this.detail = options.detail; } },
    fetch: async (_, options) => {
      const body = JSON.parse(options.body); calls.push(body.action);
      if (body.action === 'prepare' && prepareFails) throw new Error('offline');
      return { ok: true, json: async () => ({ receipt: 'receipt', complete: true }) };
    },
  });
  return { api: module.exports, calls, warnings };
}
test('notification snapshots are prepared before the database write and delivery follows it', async () => {
  const h = harness();
  assert.equal(await h.api.withNotifications([{ path: 'students/s' }], async () => { h.calls.push('write'); return 'saved'; }), 'saved');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(h.calls, ['prepare', 'write', 'finish']);
});
test('notification-server failure does not prevent saving a student record and is visible', async () => {
  const h = harness({ prepareFails: true });
  await h.api.withNotifications([{ path: 'students/s' }], async () => h.calls.push('write'));
  assert.deepEqual(h.calls, ['prepare', 'write']);
  assert.equal(h.warnings.length, 1);
});
test('failed database writes do not announce success', async () => {
  const h = harness();
  await assert.rejects(h.api.withNotifications([{ path: 'students/s' }], async () => { throw new Error('permission denied'); }), /permission denied/);
  assert.deepEqual(h.calls, ['prepare']);
});
test('disabled relay and unrelated documents preserve normal SDK behavior', async () => {
  const h = harness({ enabled: false });
  await h.api.withNotifications([{ path: 'students/s' }], async () => h.calls.push('write'));
  assert.deepEqual(h.calls, ['write']);
  const other = harness();
  await other.api.withNotifications([{ path: 'pushTokens/t' }], async () => other.calls.push('write'));
  assert.deepEqual(other.calls, ['write']);
});
