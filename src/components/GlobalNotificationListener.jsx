import React, { useEffect, useRef } from 'react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { showAppNotification, requestNotificationPermission } from '../services/notificationService';

const GLOBAL_CHAT_ID = 'chat_global_room';

const GlobalNotificationListener = () => {
  const { currentUser } = useAuth();
  
  // Track if initial snapshot payload has arrived to avoid spamming past messages
  const initialLoadRef = useRef({
    messages: true,
    timetables: true,
    announcements: true
  });

  useEffect(() => {
    // Attempt to request permission silently if not already granted
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // 1. Listen for new MESSAGES
    const qMessages = query(collection(db, 'chats', GLOBAL_CHAT_ID, 'messages'), orderBy('timestamp', 'desc'), limit(1));
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      if (initialLoadRef.current.messages) {
        initialLoadRef.current.messages = false;
        return; // Ignore the first massive chunk of old messages
      }
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docData = change.doc.data();
          // Ensure we don't notify the user of their own message
          if (docData.senderId !== currentUser.uid) {
             const sender = docData.senderName || 'Someone';
             const preview = docData.content ? docData.content : (docData.imageUrl ? 'Sent an image' : (docData.audioUrl ? 'Sent a voice message' : 'New message'));
             showAppNotification(`Bethel Chat: ${sender}`, preview, { tag: 'chat-message', data: { url: '/teacher/messaging' } });
          }
        }
      });
    });

    // 2. Listen for new SCHEDULES (timetables)
    const qSchedules = query(collection(db, 'timetables'), orderBy('createdAt', 'desc'), limit(1));
    const unsubSchedules = onSnapshot(qSchedules, (snapshot) => {
      if (initialLoadRef.current.timetables) {
        initialLoadRef.current.timetables = false;
        return;
      }
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docData = change.doc.data();
          const target = docData.teacherName || 'Everyone';
          // Filter if schedule is explicitly targeted
          if (target === 'Everyone' || target === currentUser.name) {
             showAppNotification(`New Schedule Created`, `A new schedule was published for ${target}.`, { tag: 'schedule-update', data: { url: '/teacher/schedule' } });
          }
        }
      });
    });

    // 3. Listen for new ANNOUNCEMENTS
    const qAnnouncements = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(1));
    const unsubAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      if (initialLoadRef.current.announcements) {
        initialLoadRef.current.announcements = false;
        return;
      }
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docData = change.doc.data();
          const title = docData.title || 'New Announcement';
          const body = docData.message || docData.content || (docData.targetType === 'specific' ? `For ${docData.targetName}` : 'For everyone');
          
          showAppNotification(`Announcement: ${title}`, body, { tag: 'announcement-notice', data: { url: '/teacher/dashboard' } });
        }
      });
    });

    return () => {
      unsubMessages();
      unsubSchedules();
      unsubAnnouncements();
    };
  }, [currentUser]);

  return null; // Silent background component
};

export default GlobalNotificationListener;
