import test from 'node:test';
import assert from 'node:assert/strict';
import { activityDate, belongsToTeacher, sundayActivity, teacherAttendanceDays, teacherRewards } from '../src/utils/teacherActivity.js';
import { attendanceUpdate, savedAttendance } from '../src/utils/attendanceSave.js';

const mary = { uid: 't1', name: 'Mary Joseph' };
const teachers = [mary, { uid: 't2', name: 'Daniel Paul' }];
test('teacher activity gives account IDs priority over names and never assigns unidentified records', () => {
  assert.equal(belongsToTeacher({ teacherUid: 't2', teacher: mary.name }, mary, teachers), false);
  assert.equal(belongsToTeacher({ teacherUid: 't1', teacher: 'Old name' }, mary, teachers), true);
  assert.equal(belongsToTeacher({ teacher: ' Mary Joseph ' }, mary, teachers), true);
  assert.equal(belongsToTeacher({ teacher: mary.name }, mary, [...teachers, { uid: 'duplicate', name: mary.name }]), false);
  assert.equal(belongsToTeacher({ reason: 'No author saved' }, mary, teachers), false);
  assert.equal(belongsToTeacher({ createdByUid: 't1', recordedBy: 't1', createdBy: mary.name }, mary, teachers), true);
});
test('reward history keeps children with the same name separate and preserves reasons, amounts and dates', () => {
  const students = [
    { id: 'a', name: 'Sam', studentId: 'A', rewards: [{ teacherUid: 't1', dollars: 5, reason: 'Homework', date: '2026-11-22' }] },
    { id: 'b', name: 'Sam', studentId: 'B', rewards: [{ teacherUid: 't1', dollars: '8', reason: 'Memory verse', date: '2026-11-15' }, { teacherUid: 't2', dollars: 100 }] },
  ];
  const rewards = teacherRewards(students, mary, teachers);
  assert.deepEqual(rewards.map(row => [row.studentId, row.amount, row.reason]), [['A', 5, 'Homework'], ['B', 8, 'Memory verse']]);
  assert.equal(rewards.reduce((sum, row) => sum + row.amount, 0), 13);
  assert.equal(students[1].rewards.length, 2);
});
test('Sunday activity deduplicates children, supports saved sessions and legacy names, and excludes future Sundays', () => {
  const student = { attendanceByDate: { '2026-11-22': { teacherId: 't1', status: 'absent' }, '2026-11-24': { teacherId: 't1', status: 'present' }, '2026-11-15': { teacherId: 't2', status: 'present' } }, attendance: ['2026-11-15::Mary Joseph', '2026-11-08::Mary Joseph'] };
  const days = teacherAttendanceDays([student, student], { ...mary, attendanceSessions: { '2026-11-01': { marked: true } } }, teachers);
  assert.deepEqual([...days].sort(), ['2026-11-01', '2026-11-08', '2026-11-22']);
  assert.deepEqual(sundayActivity('2026-11', days, new Date('2026-11-24T12:00:00')).map(row => [row.date, row.marked]), [['2026-11-22', true], ['2026-11-15', false], ['2026-11-08', true], ['2026-11-01', true]]);
  assert.deepEqual(sundayActivity('2026-13', days), []);
});
test('activity timestamps support Firestore, numeric and local calendar dates', () => {
  assert.equal(activityDate({ seconds: 100 }).getTime(), 100000);
  assert.equal(activityDate({ toDate: () => new Date(1000) }).getTime(), 1000);
  assert.equal(activityDate('2026-11-22').getHours(), 0);
  assert.equal(activityDate('invalid'), null);
});
test('unchanged attendance does not replace its original teacher and conflicts are rejected', () => {
  const student = { attendanceByDate: { '2026-11-22': { status: 'present', teacherId: 't2' } }, attendance: ['2026-11-22'] };
  assert.equal(attendanceUpdate(student, { date: '2026-11-22', status: 'present', expected: 'present', teacher: mary }), null);
  assert.throws(() => attendanceUpdate(student, { date: '2026-11-22', status: 'absent', expected: null, teacher: mary }), /Attendance changed/);
  assert.equal(student.attendanceByDate['2026-11-22'].teacherId, 't2');
});
test('attendance changes preserve other saved dates and unmark removes both legacy states', () => {
  const student = { attendance: ['2026-11-15::Daniel Paul', '2026-11-22::Daniel Paul'], absentDates: ['2026-11-08'] };
  const update = attendanceUpdate(student, { date: '2026-11-22', expected: 'present', status: 'absent', teacher: mary, updatedAt: 123 });
  assert.deepEqual(update.attendance, ['2026-11-15::Daniel Paul']);
  assert.deepEqual(update.absentDates, ['2026-11-08', '2026-11-22']);
  assert.equal(update['attendanceByDate.2026-11-22'].teacherId, 't1');
  assert.equal(update.currentStreak, 0);
  const unmark = attendanceUpdate(student, { date: '2026-11-22', expected: 'present', status: null, teacher: mary, removed: 'DELETE' });
  assert.equal(unmark['attendanceByDate.2026-11-22'], 'DELETE');
  assert.equal(savedAttendance(unmark, '2026-11-22'), null);
  assert.equal(unmark.currentStreak, 1);
});
