import { auth } from '../config/firebase';
const enabled = import.meta.env.VITE_NOTIFICATION_BACKEND === 'vercel';
const key = 'bethel-notification-retries';
const relevant = path => /^(students|homeworks|complaints|notifications|timetables|teacherProgress|teachers|offerings|expenses)\/[^/]+$/.test(path) || /^chats\/chat_global_room\/messages\/[^/]+$/.test(path) || /^website_activity\/[^/]+\/students\/[^/]+$/.test(path);
const warning = message => window.dispatchEvent(new CustomEvent('notification-delivery-warning', { detail: message }));
function queue() {
  try {
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(items) ? items.filter(item => item && typeof item.receipt === 'string' && typeof item.uid === 'string') : [];
  } catch { return []; }
}
function save(items) { try { localStorage.setItem(key, JSON.stringify(items.slice(-100))); } catch { /* Memory delivery still proceeds. */ } }
async function request(body) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to enable automatic notifications.');
  const token = await user.getIdToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), body.action === 'prepare' ? 8000 : 65000);
  try {
    const response = await fetch('/api/notification-events', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body), signal: controller.signal });
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error(result.error || 'Notification server is unavailable.'), { status: response.status });
    return result;
  } finally { clearTimeout(timeout); }
}
let flushing = false;
export async function retryNotifications() {
  if (!enabled || flushing || !auth.currentUser) return;
  flushing = true;
  try {
    for (const item of queue()) {
      if (item.uid !== auth.currentUser?.uid) continue;
      try {
        await request({ action: 'finish', receipt: item.receipt });
        save(queue().filter(entry => entry.receipt !== item.receipt));
      } catch (error) {
        if (error.status === 410) { save(queue().filter(entry => entry.receipt !== item.receipt)); warning('A notification retry expired. Your saved records are safe.'); }
        else { warning('Your records are saved, but some alerts are waiting for delivery. Keep this app open to retry.'); break; }
      }
    }
  } finally { flushing = false; }
}
export async function withNotifications(references, write) {
  if (!enabled) return write();
  const paths = [...new Set(references.map(ref => ref.path).filter(relevant))];
  if (!paths.length) return write();
  const uid = auth.currentUser?.uid;
  const tickets = [];
  try {
    for (let i = 0; i < paths.length; i += 100) tickets.push((await request({ action: 'prepare', paths: paths.slice(i, i + 100) })).receipt);
  } catch { warning('Automatic alerts are unavailable for this change. Your record will still be saved.'); }
  // The original SDK operation still enforces the existing Firestore rules and atomicity.
  const result = await write();
  if (tickets.length) {
    save([...queue(), ...tickets.map(receipt => ({ receipt, uid }))]);
    void retryNotifications();
  }
  return result;
}
