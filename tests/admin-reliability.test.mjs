import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import { adminSection, adminTabUrl, ADMIN_TABS } from '../src/utils/adminNavigation.js';
import { rewardBalance, rewardPeriodTotal, changeReward } from '../src/utils/rewards.js';
import * as periods from '../src/utils/activityPeriod.js';
import * as verification from '../src/utils/teacherVerification.js';
import { UserRole } from '../src/types/index.js';

test('dashboard sections survive refresh through their URL and reject invalid tabs', () => {
  for (const tab of ADMIN_TABS) {
    const url = new URL(adminTabUrl(tab), 'https://example.com');
    assert.equal(adminSection(url.pathname, url.search), tab);
  }
  assert.equal(adminSection('/admin/dashboard', '?tab=invalid'), 'home');
  assert.equal(adminSection('/teacher/dollars-giving'), 'manage');
  assert.equal(adminSection('/teacher/teacher-leaderboard'), 'staff');
  assert.equal(adminSection('/teacher/download-records'), 'more');
  assert.equal(adminSection('/teacher/attendance-summary'), 'attendance');
});
test('reward balances preserve zero corrections and support legacy history', () => {
  assert.equal(rewardBalance({ dollarPoints: 0, rewards: [{ dollars: 55 }] }), 0);
  assert.equal(rewardBalance({ dollarPoints: '12', rewards: [{ dollars: 55 }] }), 12);
  assert.equal(rewardBalance({ rewards: [{ dollars: '5' }, { dollars: 3 }] }), 8);
  assert.equal(rewardBalance({}), 0);
});
test('reward period totals include local calendar dates and ignore invalid or future dates', () => {
  const students = [{ rewards: [{ date: '2026-11-24', dollars: 8 }, { date: '2026-10-20', dollars: 30 }, { date: 'bad', dollars: 200 }, { date: '2026-12-01', dollars: 50 }] }];
  assert.equal(rewardPeriodTotal(students, new Date('2026-11-01T00:00:00'), new Date('2026-11-24T23:00:00')), 8);
});
test('history edits preserve balance corrections and reject shifted or changed entries', () => {
  const reward = { dollars: 5, date: '2026-11-24', reason: 'Homework', teacher: 'Mary' };
  const student = { dollarPoints: 20, rewards: [reward] };
  assert.equal(changeReward(student, 0, reward, 8).dollarPoints, 23);
  assert.equal(changeReward(student, 0, reward, null).dollarPoints, 15);
  assert.equal(student.rewards[0].dollars, 5);
  assert.throws(() => changeReward(student, 0, { ...reward, dollars: 9 }, 8), /reward changed/);
  assert.throws(() => changeReward(student, 0, reward, -1), /non-negative/);
});

function sessionHarness(readProfile) {
  const state = []; let listener; let cleanup; let timer;
  const react = { createContext: () => ({ Provider: 'Provider' }), createElement: (_, props) => props.value,
    useContext: () => null, useState: initial => { const i = state.length; state.push(initial); return [initial, value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; },
    useRef: current => ({ current }), useCallback: fn => fn, useEffect: fn => { cleanup = fn(); } };
  const modules = {
    react, '../services/notificationService': { unregisterPushTokenForUser: async () => {} },
    'firebase/auth': { onAuthStateChanged: (_, fn) => { listener = fn; return () => {}; } },
    '../services/notifyingFirestore': { doc: (_db, collection, uid) => ({ collection, uid }), getDoc: readProfile },
    '../config/firebase': { auth: {}, db: {} }, '../types': { UserRole }, '../utils/teacherVerification': verification,
  };
  const module = { exports: {} };
  const code = transformSync(readFileSync(new URL('../src/contexts/AuthContext.jsx', import.meta.url), 'utf8'), { loader: 'jsx', format: 'cjs' }).code;
  vm.runInNewContext(code, { module, require: name => modules[name], console, setTimeout: fn => { timer = fn; return 1; }, clearTimeout() {} });
  module.exports.AuthProvider({ children: null });
  return { state, emit: user => listener(user), timeout: () => timer(), cleanup: () => cleanup() };
}
const staff = { uid: 'staff-1', email: 'staff@example.com', metadata: { creationTime: 'same', lastSignInTime: 'same' } };
test('a missing new-user profile ends the spinner and offers recovery', async () => {
  const h = sessionHarness(async () => ({ exists: () => false }));
  await h.emit(staff);
  assert.equal(h.state[2], false);
  assert.match(h.state[4], /profile is unavailable/);
});
test('a network failure retains a recoverable error instead of silently redirecting', async () => {
  const h = sessionHarness(async () => { throw new Error('Network unavailable'); });
  await h.emit(staff);
  assert.equal(h.state[2], false);
  assert.match(h.state[4], /Network unavailable/);
});
test('a profile request completing after sign-out cannot restore the old user', async () => {
  let resolve;
  const h = sessionHarness(() => new Promise(done => { resolve = done; }));
  const pending = h.emit(staff);
  await h.emit(null);
  resolve({ exists: () => true, data: () => ({ name: 'Old user', isVerified: true }) });
  await pending;
  assert.equal(h.state[0], null);
  assert.equal(h.state[2], false);
});
test('a stalled session restoration times out without waiting forever', async () => {
  const h = sessionHarness(() => new Promise(() => {}));
  const pending = h.emit(staff);
  h.timeout();
  await pending;
  assert.equal(h.state[2], false);
  assert.match(h.state[4], /taking too long/);
});

function mutationHarness({ period = null, currentPeriod = period, retry = false } = {}) {
  let student = { name: 'Student', rewards: [{ dollars: 5 }], dollarPoints: 5 };
  let writes = [];
  const ref = path => ({ path, id: path.split('/').at(-1), parent: { path: path.split('/').slice(0, -1).join('/') } });
  const firestore = {
    collection: (...args) => ref(args[0]?.path ? `${args[0].path}/${args.slice(1).join('/')}` : args.slice(1).join('/')),
    doc: (...args) => ref(args[0]?.path ? `${args[0].path}/${args[1]}` : args.slice(1).join('/')),
    runTransaction: async (_, fn) => {
      const transaction = { get: async reference => ({ exists: () => true, data: () => reference.path.startsWith('app_settings') ? { activePeriod: currentPeriod } : student }),
        update: (reference, data) => writes.push({ path: reference.path, data }), set: (reference, data) => writes.push({ path: reference.path, data }) };
      await fn(transaction);
      if (retry) { student = { ...student, rewards: [{ dollars: 5 }, { dollars: 7 }], dollarPoints: 12 }; writes = []; await fn(transaction); }
    },
  };
  const module = { exports: {} };
  const code = transformSync(readFileSync(new URL('../src/services/studentData.js', import.meta.url), 'utf8'), { format: 'cjs', define: { 'import.meta.env.VITE_ENABLE_WEBSITE_PERIODS': '"true"' } }).code;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === './notificationRelay') return { withNotifications: (_, fn) => fn() };
    if (name === './notifyingFirestore') return firestore;
    if (name === '../config/firebase') return { db: {}, auth: { currentUser: { uid: 'admin' } } };
    if (name === '../utils/activityPeriod') return periods;
    throw new Error(name);
  } });
  module.exports.setActivePeriod(period);
  return { api: module.exports, ref: ref('students/S1'), writes: () => writes };
}
const award = student => ({ rewards: [...student.rewards, { dollars: 3 }], dollarPoints: rewardBalance(student) + 3 });
test('reward transaction retries preserve another concurrent award', async () => {
  const h = mutationHarness({ retry: true });
  await h.api.mutateStudent(h.ref, award);
  assert.equal(h.writes()[0].data.dollarPoints, 15);
  assert.equal(h.writes()[0].data.rewards.length, 3);
});
test('reward transactions respect activity periods and reject stale reset forms', async () => {
  const h = mutationHarness({ period: 'period-1' });
  await h.api.mutateStudent(h.ref, award);
  assert.equal(h.writes()[0].path, 'website_activity/period-1/students/S1');
  const stale = mutationHarness({ period: 'period-1', currentPeriod: 'period-2' });
  await assert.rejects(stale.api.mutateStudent(stale.ref, award), /period changed/);
  assert.equal(stale.writes().length, 0);
});

function workerHarness() {
  const listeners = {}; const deleted = []; const cached = []; const claimed = [];
  const store = new Map([['/index.html', new Response('offline shell')]]);
  let network = async () => new Response('network', { headers: { 'Content-Type': 'text/html' } });
  const cache = { addAll: async () => {}, put: async (key, response) => { cached.push(key); store.set(key, response); } };
  const caches = { open: async () => cache, keys: async () => ['bethel-ams-v4', 'bethel-ams-v5', 'unrelated-cache'], delete: async key => deleted.push(key), match: async key => store.get(key) };
  const self = { location: { origin: 'https://school.example' }, addEventListener: (name, fn) => { listeners[name] = fn; }, clients: { claim: async () => claimed.push(true) }, skipWaiting() {} };
  vm.runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), { self, caches, fetch: (...args) => network(...args), URL, Response });
  return { listeners, deleted, cached, claimed, setNetwork: fn => { network = fn; }, request: (url, mode = 'cors') => {
    let result;
    listeners.fetch({ request: { method: 'GET', url, mode }, respondWith: promise => { result = promise; } });
    return result;
  } };
}
test('worker activation preserves unrelated caches and the current cache', async () => {
  const h = workerHarness(); let result;
  h.listeners.activate({ waitUntil: promise => { result = promise; } }); await result;
  assert.deepEqual(h.deleted, ['bethel-ams-v4']); assert.equal(h.claimed.length, 1);
});
test('worker does not intercept APIs or cross-origin Firebase requests', () => {
  const h = workerHarness();
  assert.equal(h.request('https://school.example/api/notification-events'), undefined);
  assert.equal(h.request('https://firestore.googleapis.com/data'), undefined);
});
test('deep-link reloads fall back to the shell when offline', async () => {
  const h = workerHarness(); h.setNetwork(async () => { throw new Error('offline'); });
  const response = await h.request('https://school.example/admin/timetable', 'navigate');
  assert.equal(await response.text(), 'offline shell');
});
test('worker never caches HTML returned in place of a missing JavaScript chunk', async () => {
  const h = workerHarness(); await h.request('https://school.example/assets/missing.js');
  assert.equal(h.cached.length, 0);
});
