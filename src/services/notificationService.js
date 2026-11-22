import { setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getToken, deleteToken, onMessage } from 'firebase/messaging';
import { db, auth, messagingPromise } from '../config/firebase';

export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}
// Passive events never prompt for permission; users enable push with a button.
export async function showAppNotification(title, body, options = {}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  const payload = { body, icon: '/image.png', badge: '/image.png', tag: options.tag || 'bethel-ams', data: options.data || {} };
  try {
    const registration = await navigator.serviceWorker?.getRegistration('/firebase-cloud-messaging-push-scope');
    if (registration) { await registration.showNotification(title, payload); return true; }
    const notification = new Notification(title, payload);
    notification.onclick = () => { window.focus(); if (payload.data.url?.startsWith('/') && !payload.data.url.startsWith('//')) window.location.assign(payload.data.url); notification.close(); };
    return true;
  } catch { return false; }
}
export const notifySuccess = (title, body) => showAppNotification(title, body, { tag: 'success' });
export const notifyError = (title, body) => showAppNotification(title, body, { tag: 'error' });
let registeredToken = null;
let registeredUid = null;
export async function registerPushTokenForUser(currentUser, { requestPermission = false } = {}) {
  if (!currentUser?.uid) return null;
  if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) throw new Error('Push notifications are not supported in this browser. On iPhone or iPad, open the installed home-screen app.');
  const allowed = requestPermission ? await requestNotificationPermission() : Notification.permission === 'granted';
  if (!allowed) {
    if (requestPermission) throw new Error('Notifications are blocked or not allowed. Enable them in your browser or device settings.');
    return null;
  }
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error('Background push is not configured yet. Ask the administrator to add the Firebase Web Push certificate public key. Updates are still available in this notification inbox.');
  const messaging = await messagingPromise;
  if (!messaging) throw new Error('This browser does not support Firebase push notifications.');
  // A separate scope prevents this worker from replacing the PWA cache worker.
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/firebase-cloud-messaging-push-scope' });
  if (!registration.active) {
    await new Promise((resolve, reject) => {
      const worker = registration.installing || registration.waiting;
      if (!worker) { reject(new Error('Notification service worker is not ready. Please try again.')); return; }
      const timeout = setTimeout(() => { worker.removeEventListener('statechange', changed); reject(new Error('Notification setup timed out. Please try again.')); }, 15000);
      const changed = () => {
        if (worker.state === 'activated') { clearTimeout(timeout); worker.removeEventListener('statechange', changed); resolve(); }
        else if (worker.state === 'redundant') { clearTimeout(timeout); worker.removeEventListener('statechange', changed); reject(new Error('Could not activate notification service.')); }
      };
      worker.addEventListener('statechange', changed); changed();
    });
  }
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (!token) throw new Error('Could not register this device. Please try again.');
  if (auth.currentUser?.uid !== currentUser.uid) return null;
  await setDoc(doc(db, 'pushTokens', token), { token, uid: currentUser.uid, updatedAt: serverTimestamp(), platform: 'web' });
  registeredToken = token; registeredUid = currentUser.uid;
  return token;
}
export async function unregisterPushTokenForUser() {
  if (registeredToken && registeredUid === auth.currentUser?.uid) await deleteDoc(doc(db, 'pushTokens', registeredToken));
  const messaging = await messagingPromise;
  if (messaging && typeof Notification !== 'undefined' && Notification.permission === 'granted') await deleteToken(messaging);
  registeredToken = null; registeredUid = null;
}
export async function listenForForegroundPushMessages(handler) {
  const messaging = await messagingPromise;
  if (!messaging) return () => {};
  return onMessage(messaging, payload => {
    if (payload.data?.recipientUid && payload.data.recipientUid !== auth.currentUser?.uid) return;
    showAppNotification(payload.notification?.title || payload.data?.title || 'Bethel AMS', payload.notification?.body || payload.data?.body || '', {
      tag: payload.data?.tag || 'push', data: { url: payload.data?.url || '/' },
    });
    handler?.(payload);
  });
}
