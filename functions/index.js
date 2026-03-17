import admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

admin.initializeApp();

const db = admin.firestore();

function normalizeAudience(audience) {
  const a = (audience || 'All').toLowerCase();
  if (a.includes('teacher')) return 'TEACHER';
  if (a.includes('parent')) return 'PARENT';
  if (a.includes('admin')) return 'ADMIN';
  if (a.includes('all')) return 'ALL';
  return 'ALL';
}

async function getTokensForAudience({ audienceRole, excludeUid }) {
  let q = db.collection('pushTokens');
  if (audienceRole && audienceRole !== 'ALL') {
    q = q.where('role', '==', audienceRole);
  }
  const snap = await q.get();
  const tokens = [];
  snap.forEach((d) => {
    const data = d.data();
    if (!data?.token) return;
    if (excludeUid && data.uid === excludeUid) return;
    tokens.push(data.token);
  });
  return tokens;
}

async function sendToTokens({ tokens, title, body, data }) {
  if (!tokens.length) return { sent: 0 };

  const chunks = [];
  for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));

  let sent = 0;
  for (const chunk of chunks) {
    const res = await admin.messaging().sendEachForMulticast({
      tokens: chunk,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data || {}).map(([k, v]) => [k, v == null ? '' : String(v)])
      ),
      webpush: {
        notification: {
          icon: '/image.svg',
          badge: '/image.svg'
        },
        fcmOptions: data?.url ? { link: data.url } : undefined
      },
      android: { notification: { channelId: 'default' } }
    });

    sent += res.successCount || 0;
    const failed = (res.responses || []).filter((r) => !r.success);
    if (failed.length) logger.warn('Some tokens failed', { failed: failed.length });
  }
  return { sent };
}

// Admin announcements -> push to audience
export const pushOnAnnouncementCreated = onDocumentCreated('notifications/{id}', async (event) => {
  const note = event.data?.data();
  if (!note) return;

  const title = note.title || 'Announcement';
  const body = note.message || '';
  const audienceRole = normalizeAudience(note.audience);

  const tokens = await getTokensForAudience({ audienceRole });
  const result = await sendToTokens({
    tokens,
    title,
    body,
    data: {
      tag: 'announcement',
      url: '/parent/notifications'
    }
  });

  logger.info('Announcement push sent', { audienceRole, sent: result.sent });
});

// Global chat messages -> push to all teachers (except sender)
export const pushOnChatMessageCreated = onDocumentCreated('chats/{chatId}/messages/{messageId}', async (event) => {
  const msg = event.data?.data();
  if (!msg) return;

  const senderId = msg.senderId || null;
  const senderName = msg.senderName || 'Someone';
  const content = msg.content || '';
  if (!content) return;

  // Only for the global room (same ID used in your UI)
  if (event.params.chatId !== 'chat_global_room') return;

  const tokens = await getTokensForAudience({ audienceRole: 'TEACHER', excludeUid: senderId });
  const result = await sendToTokens({
    tokens,
    title: `New message from ${senderName}`,
    body: content.length > 120 ? content.slice(0, 120) + '…' : content,
    data: {
      tag: 'chat',
      url: '/teacher/messaging'
    }
  });

  logger.info('Chat push sent', { sent: result.sent });
});

