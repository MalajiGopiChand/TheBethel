import admin from 'firebase-admin';

const logger = console;
import { createHash } from 'node:crypto';
import { activityChanges, homeworkMatches, audienceMatches } from './notificationEvents.js';
if (!admin.apps.length) {
  const account = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  admin.initializeApp(account ? { credential: admin.credential.cert(JSON.parse(account)) } : undefined);
}
const db = admin.firestore();
export { admin, db };
const ADMIN_EMAILS = ['gop1@gmail.com', 'premkumartenali@gmail.com'];
const trigger = document => document;
const onDocumentCreated = (pattern, run) => ({ pattern, createdOnly: true, run });
const onDocumentWritten = (pattern, run) => ({ pattern, createdOnly: false, run });
const eventKey = value => createHash('sha256').update(value).digest('hex');
const uidOf = item => item.data().uid || item.id;

async function staff() {
  const teachers = await db.collection('teachers').get();
  const people = new Map();
  for (const item of teachers.docs) {
    const teacher = item.data();
    if (teacher.approvalState === 'approved' || (!['pending', 'rejected'].includes(teacher.approvalState) && (teacher.isVerified || teacher.isApproved))) {
      people.set(uidOf(item), { uid: uidOf(item), name: teacher.name || 'Teacher', role: 'TEACHER' });
    }
  }
  for (const email of ADMIN_EMAILS) {
    try {
      const user = await admin.auth().getUserByEmail(email);
      people.set(user.uid, { uid: user.uid, name: user.displayName || 'Admin', role: 'ADMIN' });
    } catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
  }
  return [...people.values()];
}
async function parents() {
  const snapshot = await db.collection('parents').get();
  return snapshot.docs.map(item => ({ ...item.data(), uid: uidOf(item), role: 'PARENT' }));
}
async function publish(eventId, people, message, actorUid) {
  const recipients = [...new Map(people.filter(person => person.uid && person.uid !== actorUid).map(person => [person.uid, person])).values()];
  // Deterministic inbox IDs make trigger retries idempotent. Each new inbox entry triggers push separately.
  for (let offset = 0; offset < recipients.length; offset += 50) {
    await Promise.all(recipients.slice(offset, offset + 50).map(async person => {
      const id = eventKey(`${eventId}:${message.type}`);
      const url = message.type === 'complaint' ? (person.role === 'ADMIN' ? '/admin/complaints' : '/parent/complaints') :
        message.type === 'chat' ? '/teacher/messaging' : person.role === 'PARENT' ? '/parent/dashboard' : person.role === 'ADMIN' ? '/admin/dashboard' : '/teacher/dashboard';
      try {
        await db.collection('user_notifications').doc(person.uid).collection('items').doc(id).create({
          title: message.title.slice(0, 160), body: message.body.slice(0, 500), type: message.type, url,
          createdAt: admin.firestore.FieldValue.serverTimestamp(), read: false,
        });
      } catch (error) { if (error.code !== 6 && error.code !== 'already-exists') throw error; }
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
          await db.collection('notification_delivery').doc(eventKey(`${person.uid}:${id}`)).create({
            eventId: eventId.replace(/:staff$/, ''), uid: person.uid,
            path: `user_notifications/${person.uid}/items/${id}`, sent: false,
          });
        } catch (error) { if (error.code !== 6 && error.code !== 'already-exists') throw error; }
      }
    }));
  }
}
export const pushOnInboxCreated = onDocumentCreated(trigger('user_notifications/{uid}/items/{id}'), async event => {
  const note = event.data?.data();
  if (!note) return;
  const tokenDocs = await db.collection('pushTokens').where('uid', '==', event.params.uid).get();
  const unique = new Map(tokenDocs.docs.filter(item => item.data().token).map(item => [item.data().token, item]));
  const entries = [...unique.entries()];
  for (let offset = 0; offset < entries.length; offset += 500) {
    const chunk = entries.slice(offset, offset + 500);
    const result = await admin.messaging().sendEachForMulticast({
      tokens: chunk.map(([token]) => token),
      notification: { title: note.title, body: note.body },
      data: { title: note.title, body: note.body, url: note.url, tag: event.params.id, recipientUid: event.params.uid },
      webpush: { headers: { TTL: '86400' }, notification: { icon: '/image.png', badge: '/image.png', tag: event.params.id, data: { url: note.url, recipientUid: event.params.uid } } },
      android: { priority: 'high', notification: { tag: event.params.id } },
    });
    let retry = false;
    await Promise.all(result.responses.map(async (response, index) => {
      if (response.success) return;
      if (['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(response.error?.code)) await chunk[index][1].ref.delete();
      else { retry = true; logger.warn('Push delivery failed', { code: response.error?.code }); }
    }));
    if (retry) throw new Error('Temporary push delivery failure; retrying.');
  }
});
async function notifyStudentActivity(event, before, after, student) {
  const changes = activityChanges(before, after, student.name || 'Your child');
  if (!changes.length) return;
  const [allParents, team] = await Promise.all([parents(), staff()]);
  const related = allParents.filter(parent => parent.studentId != null && ((student.studentId != null && String(parent.studentId) === String(student.studentId)) || String(parent.studentId) === event.params.studentId));
  for (const change of changes) {
    await publish(event.id, related, change);
    await publish(`${event.id}:staff`, team, { ...change, body: `${after.activityUpdatedByName || 'A staff member'} updated ${change.body}` }, after.activityUpdatedBy);
  }
}
export const notifyStudentActivityUpdated = onDocumentWritten(trigger('students/{studentId}'), async event => {
  if (!event.data?.after.exists) return;
  const settings = await db.doc('app_settings/website_activity').get();
  if (settings.data()?.activePeriod) return; // Original Android records remain separate after a website reset.
  await notifyStudentActivity(event, event.data.before.data(), event.data.after.data(), event.data.after.data());
});
export const notifyWebsiteActivityUpdated = onDocumentWritten(trigger('website_activity/{periodId}/students/{studentId}'), async event => {
  if (!event.data?.after.exists) return;
  const settings = await db.doc('app_settings/website_activity').get();
  if (settings.data()?.activePeriod !== event.params.periodId) return;
  const student = await db.doc(`students/${event.params.studentId}`).get();
  if (student.exists) await notifyStudentActivity(event, event.data.before.data(), event.data.after.data(), student.data());
});
export const notifyHomeworkUpdated = onDocumentWritten(trigger('homeworks/{id}'), async event => {
  const homework = event.data?.after.data();
  if (!homework) return;
  const before = event.data.before.data();
  if (before && ['title', 'description', 'subject', 'classType', 'place', 'dueDate'].every(key => JSON.stringify(before[key]) === JSON.stringify(homework[key]))) return;
  const [allParents, students, team] = await Promise.all([parents(), db.collection('students').get(), staff()]);
  const eligible = new Set(students.docs.filter(item => homeworkMatches(item.data(), homework)).flatMap(item => [item.id, item.data().studentId].filter(value => value != null).map(String)));
  await publish(event.id, allParents.filter(parent => parent.studentId != null && eligible.has(String(parent.studentId))), { type: 'homework', title: before ? 'Homework updated' : 'New homework for your child', body: `${homework.teacherName || 'Teacher'}: ${homework.title || 'New assignment'}. ${homework.description || ''}` });
  await publish(`${event.id}:staff`, team, { type: 'homework', title: 'Homework update', body: `${homework.teacherName || 'Teacher'} ${before ? 'updated' : 'posted'} ${homework.title || 'homework'}.` }, homework.teacherId);
});
export const notifyComplaintUpdated = onDocumentWritten(trigger('complaints/{id}'), async event => {
  const after = event.data?.after.data();
  if (!after) return;
  const before = event.data.before.data();
  if (!before) {
    await publish(event.id, (await staff()).filter(person => person.role === 'ADMIN'), { type: 'complaint', title: 'New parent complaint', body: `${after.parentName || 'A parent'} submitted: ${after.title || 'New issue'}.` });
  } else if (before.status !== after.status && after.parentId) {
    await publish(event.id, [{ uid: after.parentId, role: 'PARENT' }], { type: 'complaint', title: 'Complaint status updated', body: `${after.title || 'Your complaint'} is now ${after.status || 'open'}.` });
  }
});
export const pushOnChatMessageCreated = onDocumentCreated(trigger('chats/{chatId}/messages/{messageId}'), async event => {
  const message = event.data?.data();
  if (!message || event.params.chatId !== 'chat_global_room') return;
  await publish(event.id, await staff(), { type: 'chat', title: `New message from ${message.senderName || 'Staff'}`, body: message.content || (message.audioUrl ? 'Sent a voice message' : message.imageUrl ? 'Sent a photo' : 'New message') }, message.senderId);
});
export const pushOnAnnouncementCreated = onDocumentCreated(trigger('notifications/{id}'), async event => {
  const note = event.data?.data();
  if (!note || note.type === 'SCHEDULE') return;
  const people = [...await staff(), ...await parents()];
  await publish(event.id, people.filter(person => audienceMatches(person, note.audience)), { type: 'announcement', title: note.title || 'Announcement', body: note.message || '' }, note.senderId);
});
export const notifyTimetableUpdated = onDocumentWritten(trigger('timetables/{id}'), async event => {
  const timetable = event.data?.after.data();
  if (!timetable) return;
  await publish(event.id, await staff(), { type: 'schedule', title: 'Schedule updated', body: `${timetable.assignedPersonName || 'Staff'}: ${timetable.className || ''} at ${timetable.place || ''} on ${timetable.date || 'Sunday'}.` }, timetable.updatedBy);
});

export const notifyAnnouncementUpdated = onDocumentWritten(trigger('notifications/{id}'), async event => {
  const before = event.data?.before.data(), after = event.data?.after.data();
  if (!before || !after || after.type === 'SCHEDULE') return;
  if (['title', 'message', 'audience'].every(key => before[key] === after[key])) return;
  await publish(event.id, [...await staff(), ...await parents()].filter(person => audienceMatches(person, after.audience)), { type: 'announcement', title: after.title || 'Announcement updated', body: after.message || '' }, after.senderId);
});
export const notifyStudentProfileUpdated = onDocumentWritten(trigger('students/{studentId}'), async event => {
  const before = event.data?.before.data(), after = event.data?.after.data();
  if (before && after && ['name', 'studentId', 'classType', 'place', 'location'].every(key => before[key] === after[key])) return;
  const student = after || before;
  if (!student) return;
  await publish(event.id, await staff(), { type: 'student', title: after ? (before ? 'Student profile updated' : 'Student added') : 'Student removed', body: `${student.name || 'Student'} (${student.studentId || event.params.studentId})` });
});
export const notifyTeacherReportUpdated = onDocumentWritten(trigger('teacherProgress/{id}'), async event => {
  const report = event.data?.after.data();
  if (!report) return;
  await publish(event.id, await staff(), { type: 'report', title: 'Teacher report updated', body: `${report.teacherName || 'A teacher'} submitted or updated a report.` }, report.teacherId);
});
export const notifyTeacherApprovalUpdated = onDocumentWritten(trigger('teachers/{id}'), async event => {
  const before = event.data?.before.data(), after = event.data?.after.data();
  if (!after) return;
  if (!before) {
    await publish(event.id, (await staff()).filter(person => person.role === 'ADMIN'), { type: 'teacher', title: 'Teacher registration', body: `${after.name || 'A teacher'} registered and may need approval.` });
  } else if (['approvalState', 'isVerified', 'isApproved'].some(key => before[key] !== after[key])) {
    await publish(event.id, [{ uid: after.uid || event.params.id, role: 'TEACHER' }], { type: 'teacher', title: 'Teacher account updated', body: `Your approval status is now ${after.approvalState || (after.isVerified || after.isApproved ? 'approved' : 'pending')}.` });
  }
});
async function financeNotice(event) {
  const record = event.data?.after.data() || event.data?.before.data();
  if (!record) return;
  await publish(event.id, (await staff()).filter(person => person.role === 'ADMIN'), { type: 'finance', title: 'Finance record updated', body: `${record.type || 'Finance'} record for ${record.place || 'school'} was ${event.data.after.exists ? 'saved' : 'removed'}.` }, record.recordedBy);
}
export const notifyOfferingUpdated = onDocumentWritten(trigger('offerings/{id}'), financeNotice);
export const notifyExpenseUpdated = onDocumentWritten(trigger('expenses/{id}'), financeNotice);
