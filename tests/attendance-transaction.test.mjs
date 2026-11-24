import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
import * as periods from '../src/utils/activityPeriod.js';
import { attendanceUpdate } from '../src/utils/attendanceSave.js';
import { mapTeacherDocToCurrentUser } from '../src/utils/teacherVerification.js';

const ref = path => ({ path, id: path.split('/').at(-1), parent: { path: path.split('/').slice(0, -1).join('/') } });
function harness({ period = null, active = period, conflict = false, fail = false } = {}) {
  let committed = []; let notifications = [];
  const firestore = {
    collection: (_db, ...parts) => ref(parts.join('/')),
    doc: (base, ...parts) => ref([base.path, ...parts].filter(Boolean).join('/')),
    runTransaction: async (_, fn) => {
      let writes = [];
      const transaction = {
        get: async reference => {
          assert.equal(writes.length, 0, 'all reads must finish before the first write');
          const data = reference.path.startsWith('app_settings') ? { activePeriod: active }
            : conflict && reference.id === 'B' ? { attendanceByDate: { '2026-11-22': { status: 'absent', teacherId: 'other' } } }
              : { attendance: ['2026-11-15::Other teacher'], absentDates: [], attendanceByDate: {} };
          return { exists: () => true, data: () => data };
        },
        update: (reference, data) => writes.push({ path: reference.path, data }),
        set: (reference, data) => writes.push({ path: reference.path, data }),
      };
      await fn(transaction);
      if (fail) throw new Error('Write rejected');
      committed = writes;
    },
  };
  const module = { exports: {} };
  const code = transformSync(readFileSync(new URL('../src/services/studentData.js', import.meta.url), 'utf8'), { format: 'cjs', define: { 'import.meta.env.VITE_ENABLE_WEBSITE_PERIODS': '"true"' } }).code;
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === './notificationRelay') return { withNotifications: async (refs, fn) => { const result = await fn(); notifications.push(...refs.map(item => item.path)); return result; } };
    if (name === './notifyingFirestore') return firestore;
    if (name === '../config/firebase') return { db: {}, auth: { currentUser: { uid: 't1' } } };
    if (name === '../utils/activityPeriod') return periods;
    throw new Error(name);
  } });
  module.exports.setActivePeriod(period);
  return { api: module.exports, committed: () => committed, notifications: () => notifications };
}
const mark = fresh => attendanceUpdate(fresh, { date: '2026-11-22', expected: null, status: 'present', teacher: { uid: 't1', name: 'Mary' }, updatedAt: 123 });
const changes = () => [[ref('students/A'), mark], [ref('students/B'), mark]];
const session = () => [[ref('teachers/t1'), { 'attendanceSessions.2026-11-22': { marked: true } }]];
test('attendance and teacher Sunday session commit together and preserve another date', async () => {
  const h = harness();
  await h.api.mutateStudents(changes(), session());
  assert.equal(h.committed().length, 3);
  assert.deepEqual([...h.committed()[0].data.attendance], ['2026-11-15::Other teacher', '2026-11-22']);
  assert.equal(h.committed()[2].path, 'teachers/t1');
  assert.equal(h.notifications().length, 3);
});
test('a conflicting or failed attendance save never commits a partial class or teacher session', async () => {
  for (const options of [{ conflict: true }, { fail: true }]) {
    const h = harness(options);
    await assert.rejects(h.api.mutateStudents(changes(), session()));
    assert.equal(h.committed().length, 0);
    assert.equal(h.notifications().length, 0);
  }
});
test('attendance uses the current activity period and rejects stale periods before writing', async () => {
  const h = harness({ period: 'P1' });
  await h.api.mutateStudents(changes(), session());
  assert.equal(h.committed()[0].path, 'website_activity/P1/students/A');
  assert.equal(h.committed()[0].data.attendanceByDate['2026-11-22'].teacherId, 't1');
  const stale = harness({ period: 'P1', active: 'P2' });
  await assert.rejects(stale.api.mutateStudents(changes(), session()), /period changed/);
  assert.equal(stale.committed().length, 0);
});
test('editing a profile cannot replace the authenticated sign-in email', () => {
  const user = mapTeacherDocToCurrentUser({ name: 'Teacher', email: 'gop1@gmail.com' }, { uid: 't1', email: 'teacher@example.com' });
  assert.equal(user.email, 'teacher@example.com');
});
