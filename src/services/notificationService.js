import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

// Request notification permission
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

const DEFAULT_ICON = '/image.png';

// Show a notification in the most reliable way for PWA/mobile:
// Prefer ServiceWorkerRegistration.showNotification (works better in background),
// fallback to the Notification constructor.
export const showAppNotification = async (title, body, options = {}) => {
  const ok = await requestNotificationPermission();
  if (!ok) return false;

  const payload = {
    body,
    icon: options.icon || DEFAULT_ICON,
    badge: options.badge || options.icon || DEFAULT_ICON,
    tag: options.tag || 'bethel-ams',
    requireInteraction: false,
    silent: false,
    data: options.data || {},
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.showNotification) {
        await reg.showNotification(title, payload);
        return true;
      }
    }
  } catch {
    // ignore fallback
  }

  try {
    // eslint-disable-next-line no-new
    new Notification(title, payload);
    return true;
  } catch {
    return false;
  }
};

export const notifySuccess = (title, body) => showAppNotification(title, body, { tag: 'success' });
export const notifyError = (title, body) => showAppNotification(title, body, { tag: 'error' });

// Send notification to all teachers
export const sendNotificationToTeachers = async (senderName, messageContent) => {
  try {
    // Save notification to Firestore for persistence
    await addDoc(collection(db, 'chatNotifications'), {
      title: `New message from ${senderName}`,
      body: messageContent,
      senderName,
      messageContent,
      timestamp: new Date(),
      type: 'chat_message',
      read: false
    });

    // Show immediate browser notification for current user if not the sender
    // (We'll check this in the component)
    showAppNotification(`New message from ${senderName}`, messageContent, { tag: 'chat-message' });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Listen for new chat notifications
export const listenForChatNotifications = (currentUserId, callback) => {
  const notificationsQuery = query(
    collection(db, 'chatNotifications'),
    where('read', '==', false)
  );

  return onSnapshot(notificationsQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        // Don't show notification if user sent the message themselves
        if (data.senderId !== currentUserId) {
          showAppNotification(data.title, data.body, { tag: 'chat-message' });
          if (callback) callback(data);
        }
      }
    });
  });
};
