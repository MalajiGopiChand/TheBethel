import test from 'node:test';
import assert from 'node:assert/strict';
import { studentDetailsId } from '../src/utils/studentDetailsAccess.js';
import { parentAttendance } from '../src/utils/parentActivity.js';
test('parent detail lookup ignores a different student supplied in the URL', () => {
  assert.equal(studentDetailsId({ role: 'PARENT', studentId: 'own-child' }, 'other-child'), 'own-child');
  assert.equal(studentDetailsId({ role: 'PARENT', studentId: 'own-child' }, null), 'own-child');
});
test('a parent without a linked child cannot select one using the URL', () => {
  assert.equal(studentDetailsId({ role: 'PARENT' }, 'other-child'), null);
});
test('staff retain their existing student lookup', () => {
  assert.equal(studentDetailsId({ role: 'TEACHER' }, 'selected-child'), 'selected-child');
  assert.equal(studentDetailsId({ role: 'ADMIN' }, 'selected-child'), 'selected-child');
});
test('legacy attendance containing teacher names merges with structured attendance', () => {
  assert.deepEqual(parentAttendance({ attendance: ['2026-11-15::Teacher'], attendanceByDate: { '2026-11-15': { status: 'present' } } }), [{ date: '2026-11-15', status: 'present' }]);
});
