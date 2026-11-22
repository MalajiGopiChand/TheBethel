import * as firestore from 'firebase/firestore';
import { withNotifications } from './notificationRelay';
export * from 'firebase/firestore';
export const setDoc = (ref, ...args) => withNotifications([ref], () => firestore.setDoc(ref, ...args));
export const updateDoc = (ref, ...args) => withNotifications([ref], () => firestore.updateDoc(ref, ...args));
export const deleteDoc = ref => withNotifications([ref], () => firestore.deleteDoc(ref));
export async function addDoc(collection, data) {
  const ref = firestore.doc(collection);
  await setDoc(ref, data);
  return ref;
}
export function writeBatch(db) {
  const batch = firestore.writeBatch(db), refs = [];
  const wrapped = { commit: () => withNotifications(refs, () => batch.commit()) };
  for (const method of ['set', 'update', 'delete']) wrapped[method] = (ref, ...args) => { refs.push(ref); batch[method](ref, ...args); return wrapped; };
  return wrapped;
}
