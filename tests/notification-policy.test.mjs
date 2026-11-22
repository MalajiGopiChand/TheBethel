import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedPath, mayNotify, matchPattern } from '../server/notificationPolicy.js';
import handler from '../api/notification-events.js';

test('notification relay rejects arbitrary database paths and traversal', () => {
  for (const path of ['parents/private', 'users/admin', 'pushTokens/token', 'notification_receipts/a', 'students/../secret', 'students/id/nested/doc']) assert.equal(allowedPath(path), false);
  assert.equal(allowedPath('website_activity/period/students/student'), true);
  assert.equal(allowedPath('chats/chat_global_room/messages/id'), true);
});
test('parents can notify only their own complaints, never attendance or another parent complaint', () => {
  const user = { uid: 'parent' };
  assert.equal(mayNotify('complaints/own', user, null, true, { parentId: 'parent' }), true);
  assert.equal(mayNotify('complaints/other', user, null, true, { parentId: 'other' }), false);
  assert.equal(!!mayNotify('students/child', user, null, true, {}), false);
});
test('pending teachers cannot notify student updates despite legacy verification', () => {
  assert.equal(!!mayNotify('students/child', { uid: 't' }, { approvalState: 'pending', isVerified: true }, false, {}), false);
  assert.equal(mayNotify('students/child', { uid: 't' }, { approvalState: 'approved' }, false, {}), true);
  assert.equal(mayNotify('teachers/t', { uid: 't' }, null, false, null), true);
  assert.equal(mayNotify('teachers/other', { uid: 't' }, null, false, null), false);
});
test('handler paths match exact depth and produce the correct student identity', () => {
  assert.deepEqual(matchPattern('website_activity/{periodId}/students/{studentId}', 'website_activity/p/students/s'), { periodId: 'p', studentId: 's' });
  assert.equal(matchPattern('students/{studentId}', 'parents/s'), null);
  assert.equal(matchPattern('students/{studentId}', 'students/s/nested/x'), null);
});
test('notification endpoint rejects non-POST calls without touching Firebase', async () => {
  const response = { setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.value = value; } };
  await handler({ method: 'GET' }, response);
  assert.equal(response.code, 405);
});
