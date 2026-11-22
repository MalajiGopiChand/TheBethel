import { randomUUID } from 'node:crypto';
import { allowedPath, mayNotify, matchPattern } from '../server/notificationPolicy.js';

const fail = (status, message) => Object.assign(new Error(message), { status });
const snapshot = value => ({ exists: value != null, data: () => value ?? undefined });
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'POST required.' }); }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return res.status(503).json({ error: 'Notification server credentials are not configured.' });
  let receiptRef, lease;
  try {
    if (JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON).project_id !== 'the-bethel-ams') throw fail(503, 'Notification credentials must belong to the-bethel-ams.');
    const handlers = await import('../functions/notificationHandlers.js');
    const { admin, db } = handlers;
    const bearer = /^Bearer (.+)$/.exec(req.headers.authorization || '');
    if (!bearer) throw fail(401, 'Sign in to use notifications.');
    let user;
    try { user = await admin.auth().verifyIdToken(bearer[1], true); }
    catch { throw fail(401, 'Your session expired. Sign in again.'); }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const [teacher, parent] = await Promise.all([db.doc(`teachers/${user.uid}`).get(), db.doc(`parents/${user.uid}`).get()]);
    if (body?.action === 'prepare') {
      if (!Array.isArray(body.paths) || !body.paths.length || body.paths.length > 100 || !body.paths.every(allowedPath)) throw fail(400, 'Invalid notification paths.');
      // A per-account budget limits authenticated request floods without polling collections.
      await db.runTransaction(async tx => {
        const ref = db.doc(`notification_limits/${user.uid}`), old = (await tx.get(ref)).data();
        const window = Math.floor(Date.now() / 60000);
        const count = old?.window === window ? old.count + 1 : 1;
        if (count > 60) throw fail(429, 'Too many notification requests. Try again shortly.');
        tx.set(ref, { window, count });
      });
      const docs = await db.getAll(...[...new Set(body.paths)].map(path => db.doc(path)));
      if (docs.some(doc => !mayNotify(doc.ref.path, user, teacher.data(), parent.exists, doc.data()))) throw fail(403, 'You cannot notify changes to these records.');
      const receipt = db.collection('notification_receipts').doc();
      const batch = db.batch();
      batch.create(receipt, { uid: user.uid, createdAt: Date.now(), state: 'pending', paths: docs.map(doc => doc.ref.path) });
      // Separate snapshots avoid Firestore's one-megabyte limit for attendance batches.
      docs.forEach((doc, i) => batch.create(receipt.collection('before').doc(String(i)), { value: doc.data() || null, version: doc.updateTime?.toMillis() || 0 }));
      await batch.commit();
      return res.status(200).json({ receipt: receipt.id });
    }
    if (body?.action !== 'finish' || !/^[A-Za-z0-9]{20}$/.test(body.receipt || '')) throw fail(400, 'Invalid notification receipt.');
    receiptRef = db.doc(`notification_receipts/${body.receipt}`);
    lease = randomUUID();
    const receipt = await db.runTransaction(async tx => {
      const value = (await tx.get(receiptRef)).data();
      if (!value || value.uid !== user.uid) throw fail(403, 'Notification receipt is unavailable.');
      if (value.state === 'complete') return null;
      if (Date.now() - value.createdAt > 86400000) throw fail(410, 'Notification retry expired.');
      if (value.leaseUntil > Date.now()) throw fail(409, 'Notification processing is already running.');
      tx.update(receiptRef, { lease, leaseUntil: Date.now() + 90000 });
      return value;
    });
    if (!receipt) return res.status(200).json({ complete: true });
    const before = await receiptRef.collection('before').get();
    let captured = await receiptRef.collection('after').get();
    if (!receipt.captured) {
      const current = await db.getAll(...receipt.paths.map(path => db.doc(path)));
      const batch = db.batch();
      current.forEach((doc, i) => batch.set(receiptRef.collection('after').doc(String(i)), {
        value: doc.data() || null, version: doc.updateTime?.toMillis() || 0,
        eventVersion: doc.updateTime ? `${doc.updateTime.seconds}-${doc.updateTime.nanoseconds}` : null,
      }));
      batch.update(receiptRef, { captured: true });
      await batch.commit();
      captured = await receiptRef.collection('after').get();
    }
    // Retries use frozen server snapshots, even if another staff member edits later.
    const after = receipt.paths.map((path, i) => {
      const value = captured.docs.find(doc => doc.id === String(i))?.data();
      if (!value) throw fail(500, 'Notification result snapshot is missing.');
      return { ...snapshot(value.value), ref: db.doc(path), version: value.version, eventVersion: value.eventVersion };
    });
    for (let i = receipt.processed || 0; i < after.length; i++) {
      const old = before.docs.find(doc => doc.id === String(i))?.data();
      if (!old) throw fail(500, 'Notification snapshot is missing.');
      const current = after[i], path = current.ref.path;
      if (!mayNotify(path, user, teacher.data(), parent.exists, current.data() || old.value)) throw fail(403, 'Record is not available for notification.');
      if (current.version === old.version) continue;
      const event = {
        id: `${path}:${current.eventVersion || `deleted-${old.version}`}`,
        data: { before: snapshot(old.value), after: snapshot(current.data()) },
      };
      for (const entry of Object.values(handlers)) {
        if (!entry?.pattern || entry.pattern.startsWith('user_notifications/')) continue;
        const params = matchPattern(entry.pattern, path);
        if (!params || (entry.createdOnly && (old.value || !current.exists))) continue;
        await entry.run({ ...event, params, data: entry.createdOnly ? snapshot(current.data()) : event.data });
      }
      // A large attendance batch resumes after the last fully published student.
      await receiptRef.update({ processed: i + 1 });
    }
    // Publish records the exact inbox paths in the delivery collection for bounded retries.
    // Only inbox documents created for these immutable event IDs are selected.
    const eventIds = after.map((doc, i) => `${doc.ref.path}:${doc.eventVersion || `deleted-${before.docs.find(x => x.id === String(i))?.data().version}`}`);
    for (const eventId of eventIds) {
      const pending = await db.collection('notification_delivery').where('eventId', '==', eventId).get();
      for (const item of pending.docs) {
        const data = item.data();
        if (data.sent) continue;
        const note = await db.doc(data.path).get();
        if (note.exists) await handlers.pushOnInboxCreated.run({ data: note, params: { uid: data.uid, id: note.id } });
        await item.ref.update({ sent: true });
      }
    }
    await receiptRef.update({ state: 'complete', leaseUntil: 0 });
    const cleanup = db.batch(); [...before.docs, ...captured.docs].forEach(doc => cleanup.delete(doc.ref)); await cleanup.commit();
    return res.status(200).json({ complete: true });
  } catch (error) {
    if (receiptRef && lease) {
      try {
        const { db } = await import('../functions/notificationHandlers.js');
        await db.runTransaction(async tx => { const doc = await tx.get(receiptRef); if (doc.data()?.lease === lease) tx.update(receiptRef, { leaseUntil: 0 }); });
      } catch { /* A lease also expires automatically after a terminated invocation. */ }
    }
    return res.status(error.status || 503).json({ error: error.status ? error.message : 'Notifications could not be delivered. Saved records are unchanged; delivery can be retried.' });
  }
}
