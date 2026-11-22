import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import * as periods from '../src/utils/activityPeriod.js';
import { activityChanges, homeworkMatches, audienceMatches } from '../functions/notificationEvents.js';

const original = { name: 'Gopi', studentId: 'S1', classType: 'Primary', attendance: ['2026-11-15'], absentDates: ['2026-11-08'], attendanceByDate: { '2026-11-15': { status: 'present' } }, rewards: [{ dollars: 12 }], dollarPoints: 12, currentStreak: 2 };
test('reset view retains identity and clears all activity without mutating stored data', () => {
  const saved = structuredClone(original);
  const view = periods.projectStudent(original, null, 'new-period');
  assert.equal(view.name, 'Gopi'); assert.equal(view.studentId, 'S1');
  assert.deepEqual(view.attendance, []); assert.deepEqual(view.absentDates, []);
  assert.deepEqual(view.attendanceByDate, {}); assert.deepEqual(view.rewards, []);
  assert.equal(view.dollarPoints, 0); assert.equal(view.currentStreak, 0);
  assert.deepEqual(original, saved);
});
test('new activity never falls back to historic totals, even when new balance is zero', () => {
  assert.equal(periods.projectStudent(original, { dollarPoints: 0 }, 'new').dollarPoints, 0);
  assert.equal(periods.projectStudent(original, { name: 'Wrong', dollarPoints: 5 }, 'new').name, 'Gopi');
  assert.equal(periods.projectStudent(original, null, null), original);
});
test('attendance date field paths and profile edits go to separate write targets', () => {
  const result = periods.splitStudentUpdate({ name: 'New name', 'attendanceByDate.2026-11-22': { status: 'present' }, rewards: [] });
  assert.deepEqual(result.profile, { name: 'New name' });
  assert.deepEqual(periods.expandFieldPaths(result.activity), { attendanceByDate: { '2026-11-22': { status: 'present' } }, rewards: [] });
});
function harness() {
  let current = 'period-1'; const writes = []; let sequence = 0;
  const reference = path => ({ path, id: path.split('/').at(-1), parent: { path: path.split('/').slice(0, -1).join('/') } });
  const firestore = {
    collection: (...args) => reference(args[0]?.path ? `${args[0].path}/${args.slice(1).join('/')}` : args.slice(1).join('/')),
    doc: (...args) => args[0]?.path ? reference(`${args[0].path}/${args[1] || `period-${++sequence}`}`) : reference(args.slice(1).join('/')),
    query: base => ({ base }), serverTimestamp: () => 'SERVER_TIME',
    runTransaction: async (_db, callback) => callback({
      get: async () => ({ data: () => ({ activePeriod: current }) }),
      set: (ref, data, options) => writes.push({ type: 'set', path: ref.path, data, options }),
      update: (ref, data) => writes.push({ type: 'update', path: ref.path, data }),
    }),
  };
  const source = transformSync(readFileSync(new URL('../src/services/studentData.js', import.meta.url), 'utf8'), { format: 'cjs', define: { 'import.meta.env.VITE_ENABLE_WEBSITE_PERIODS': '"true"' } }).code;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, require: name => {
    if (name === './notificationRelay') return { withNotifications: (_refs, write) => write() };
    if (name === './notifyingFirestore' || name === 'firebase/firestore') return firestore;
    if (name === '../config/firebase') return { db: {}, auth: { currentUser: { uid: 'admin', displayName: 'Admin' } } };
    if (name === '../utils/activityPeriod') return periods;
    throw new Error(name);
  } });
  return { api: module.exports, writes, reference, changePeriod: value => { current = value; } };
}
test('saving after a reset writes activity separately and leaves original history untouched', async () => {
  const h = harness(); h.api.setActivePeriod('period-1');
  await h.api.updateDoc(h.reference('students/S1'), { rewards: [{ dollars: 5 }], dollarPoints: 5, name: 'Gopi' });
  assert.equal(h.writes[0].path, 'students/S1'); assert.deepEqual(Object.keys(h.writes[0].data), ['name']);
  assert.equal(h.writes[1].path, 'website_activity/period-1/students/S1');
  assert.equal(h.writes[1].data.dollarPoints, 5);
});
test('an old open attendance form cannot commit into a newer period', async () => {
  const h = harness(); h.api.setActivePeriod('period-1');
  const batch = h.api.writeBatch({}); batch.update(h.reference('students/S1'), { attendance: ['2026-11-22'] });
  h.changePeriod('period-2');
  await assert.rejects(batch.commit(), /period changed/);
  assert.equal(h.writes.length, 0);
});
test('reset changes only configuration and creates an archive-period marker, without deleting any student data', async () => {
  const h = harness(); await h.api.startNewActivityPeriod('admin');
  assert.equal(h.writes.length, 2);
  assert.ok(h.writes.every(write => write.type === 'set' && !write.path.startsWith('students/')));
  assert.equal(h.writes[0].data.previousPeriod, 'period-1');
  assert.equal(h.writes[1].path, 'app_settings/website_activity');
});
test('attendance alerts ignore metadata-only changes and notify status changes', () => {
  assert.equal(activityChanges(original, { ...original, attendanceByDate: { '2026-11-15': { status: 'present', teacherName: 'New' } } }).length, 0);
  const notices = activityChanges({}, { attendance: ['2026-11-22'] }, 'Gopi');
  assert.equal(notices[0].type, 'attendance'); assert.match(notices[0].body, /Gopi.*present/);
});
test('reward notifications handle positive awards, corrections, and zero balances', () => {
  assert.match(activityChanges({ dollarPoints: 5 }, { dollarPoints: 8 }, 'Gopi')[0].body, /received 3 dollars/);
  assert.match(activityChanges({ dollarPoints: 5 }, { dollarPoints: 0 }, 'Gopi')[0].body, /Current total: 0/);
});
test('homework is limited to the matching class and branch', () => {
  assert.equal(homeworkMatches({ classType: 'Primary', place: 'Kandrika' }, { classType: 'Primary', place: 'Kandrika' }), true);
  assert.equal(homeworkMatches({ classType: 'Secondary', place: 'Kandrika' }, { classType: 'Primary' }), false);
  assert.equal(homeworkMatches({ classType: 'Primary', place: 'Other' }, { place: 'Kandrika' }), false);
});
test('named announcements and unknown audiences never broadcast to everyone', () => {
  assert.equal(audienceMatches({ name: 'Gopi', role: 'TEACHER' }, 'Gopi'), true);
  assert.equal(audienceMatches({ name: 'Other', role: 'PARENT' }, 'Gopi'), false);
  assert.equal(audienceMatches({ role: 'PARENT' }, 'Teachers'), false);
  assert.equal(audienceMatches({ role: 'PARENT' }, 'All Students'), true);
  assert.equal(audienceMatches({ role: 'PARENT' }, undefined), false);
});
