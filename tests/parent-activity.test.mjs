import test from 'node:test';
import assert from 'node:assert/strict';
import { parentAttendance, parentRewards, activityDate } from '../src/utils/parentActivity.js';
test('parent attendance merges legacy dates with authoritative daily records without duplicates', () => {
  const result = parentAttendance({ attendance: ['2026-11-01', '2026-11-01'], absentDates: ['2026-11-08'], attendanceByDate: { '2026-11-08': { status: 'present' }, '2026-11-15': { status: 'absent' } } });
  assert.deepEqual(result, [{ date: '2026-11-15', status: 'absent' }, { date: '2026-11-08', status: 'present' }, { date: '2026-11-01', status: 'present' }]);
});
test('parent rewards sort newest first without changing the database array', () => {
  const rewards = [{ date: '2026-11-01', dollars: 5 }, { date: '2026-11-15', dollars: -2 }];
  assert.equal(parentRewards({ rewards })[0].dollars, -2);
  assert.equal(rewards[0].dollars, 5);
});
test('parent activity handles reset views, missing dates and Firebase timestamps', () => {
  assert.deepEqual(parentAttendance({}), []);
  assert.deepEqual(parentRewards({}), []);
  assert.equal(activityDate(undefined), null);
  assert.equal(activityDate('bad-date'), null);
  assert.equal(activityDate({ toDate: () => new Date('2026-11-15') }).getUTCDate(), 15);
});
