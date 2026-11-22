import { withNotifications } from './notificationRelay';
// Student reads expose the current website period. Original records are never cleared.
// Other collections retain the standard Firestore API behavior.
import * as firestore from "./notifyingFirestore";
import { db, auth } from '../config/firebase';
import { projectStudent, splitStudentUpdate, expandFieldPaths } from '../utils/activityPeriod';
export * from "./notifyingFirestore";

export const websitePeriodsEnabled = import.meta.env.VITE_ENABLE_WEBSITE_PERIODS === 'true';
let activePeriod = null;
const studentQueries = new WeakSet();
export const setActivePeriod = id => { activePeriod = id || null; };
export const periodSettingsRef = () => firestore.doc(db, 'app_settings', 'website_activity');
const activityCollection = period => firestore.collection(db, 'website_activity', period, 'students');
const activityDoc = (period, id) => firestore.doc(activityCollection(period), id);
const isStudent = ref => studentQueries.has(ref) || ref?.path === 'students' || ref?.parent?.path === 'students';
export function collection(...args) {
  const result = firestore.collection(...args);
  if (result.path === 'students') studentQueries.add(result);
  return result;
}
export function query(base, ...constraints) {
  const result = firestore.query(base, ...constraints);
  if (isStudent(base)) studentQueries.add(result);
  return result;
}
function wrapDoc(snapshot, activity, period) {
  return new Proxy(snapshot, { get(target, key) {
    if (key === 'data') return options => projectStudent(target.data(options), activity, period);
    const value = Reflect.get(target, key);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
}
function wrapSnapshot(snapshot, activities, period) {
  if (!snapshot.docs) return wrapDoc(snapshot, activities.get(snapshot.id), period);
  const docs = snapshot.docs.map(item => wrapDoc(item, activities.get(item.id), period));
  return new Proxy(snapshot, { get(target, key) {
    if (key === 'docs') return docs;
    if (key === 'forEach') return callback => docs.forEach(callback);
    const value = Reflect.get(target, key);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
}
export function onSnapshot(reference, next, error) {
  const period = activePeriod;
  if (!period || !isStudent(reference)) return firestore.onSnapshot(reference, next, error);
  let base, activities;
  const emit = () => { if (base && activities) next(wrapSnapshot(base, activities, period)); };
  const stopBase = firestore.onSnapshot(reference, value => { base = value; emit(); }, error);
  const stopActivity = firestore.onSnapshot(activityCollection(period), value => {
    activities = new Map(value.docs.map(item => [item.id, item.data()])); emit();
  }, error);
  return () => { stopBase(); stopActivity(); };
}
export async function getDoc(reference) {
  const period = activePeriod;
  if (!period || !isStudent(reference)) return firestore.getDoc(reference);
  const [base, activity] = await Promise.all([firestore.getDoc(reference), firestore.getDoc(activityDoc(period, reference.id))]);
  return wrapDoc(base, activity.data(), period);
}
export async function getDocs(reference) {
  const period = activePeriod;
  if (!period || !isStudent(reference)) return firestore.getDocs(reference);
  const [base, activity] = await Promise.all([firestore.getDocs(reference), firestore.getDocs(activityCollection(period))]);
  return wrapSnapshot(base, new Map(activity.docs.map(item => [item.id, item.data()])), period);
}
async function commitUpdates(updates, period) {
  if (!websitePeriodsEnabled) {
    const batch = firestore.writeBatch(db);
    for (const [reference, update] of updates) {
      const hasActivity = Object.keys(splitStudentUpdate(update).activity).length > 0;
      batch.update(reference, hasActivity ? { ...update, activityUpdatedBy: auth.currentUser?.uid || '', activityUpdatedByName: auth.currentUser?.displayName || 'Staff' } : update);
    }
    return batch.commit();
  }
  // Check the generation in the same transaction: a stale tab cannot write into a new period.
  const targets = updates.flatMap(([reference]) => period && isStudent(reference) ? [reference, activityDoc(period, reference.id)] : [reference]);
  return withNotifications(targets, () => firestore.runTransaction(db, async transaction => {
    const settings = await transaction.get(periodSettingsRef());
    if ((settings.data()?.activePeriod || null) !== period) throw new Error('The website data period changed. Reload the page before saving.');
    for (const [reference, update] of updates) {
      if (!period || !isStudent(reference)) {
        const hasActivity = isStudent(reference) && Object.keys(splitStudentUpdate(update).activity).length > 0;
        transaction.update(reference, hasActivity ? { ...update, activityUpdatedBy: auth.currentUser?.uid || '', activityUpdatedByName: auth.currentUser?.displayName || 'Staff' } : update); continue;
      }
      const { profile, activity } = splitStudentUpdate(update);
      if (Object.keys(profile).length) transaction.update(reference, profile);
      if (Object.keys(activity).length) transaction.set(activityDoc(period, reference.id), { ...expandFieldPaths(activity), activityUpdatedBy: auth.currentUser?.uid || '', activityUpdatedByName: auth.currentUser?.displayName || auth.currentUser?.email || 'Staff' }, { merge: true });
    }
  }));
}
export function updateDoc(reference, update) {
  if (!isStudent(reference)) return firestore.updateDoc(reference, update);
  return commitUpdates([[reference, update]], activePeriod);
}
export function writeBatch(database) {
  const period = activePeriod;
  const updates = [];
  // Attendance uses update-only batches. Keep all updates in a single atomic transaction.
  return { update(reference, data) { updates.push([reference, data]); return this; }, commit() { return commitUpdates(updates, period); } };
}
export async function startNewActivityPeriod(userId) {
  if (!websitePeriodsEnabled) throw new Error('Website periods must be enabled after deploying Firestore rules.');
  const newPeriod = firestore.doc(firestore.collection(db, 'website_activity'));
  await firestore.runTransaction(db, async transaction => {
    const settings = await transaction.get(periodSettingsRef());
    transaction.set(newPeriod, { createdAt: firestore.serverTimestamp(), createdBy: userId, previousPeriod: settings.data()?.activePeriod || null });
    transaction.set(periodSettingsRef(), { activePeriod: newPeriod.id, resetAt: firestore.serverTimestamp(), resetBy: userId });
  });
  return newPeriod.id;
}
