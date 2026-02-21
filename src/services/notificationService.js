import { collection, addDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
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

// Show browser notification
const showBrowserNotification = (title, body, icon = '/icon-192x192.png') => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: 'chat-message',
      requireInteraction: false,
      silent: false
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }
};

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
    showBrowserNotification(
      `New message from ${senderName}`,
      messageContent
    );
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
          showBrowserNotification(data.title, data.body);
          if (callback) callback(data);
        }
      }
    });
  });
};
