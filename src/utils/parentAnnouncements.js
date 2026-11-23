import { activityDate } from './parentActivity.js';

const parentAudiences = new Set(['all', 'parents', 'parent', 'all students', 'students']);

export function parentAnnouncements(docs, locale, maximum = Infinity) {
  const formatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  return docs.flatMap(doc => {
    const data = doc.data();
    const audience = String(data.audience || 'All').trim();
    if (!parentAudiences.has(audience.toLowerCase())) return [];
    const published = activityDate(data.createdAt) || activityDate(data.date);
    return [{
      id: doc.id, title: data.title || '', message: data.message || '',
      sender: data.sender || '', isImportant: Boolean(data.isImportant), audience,
      date: published ? formatter.format(published) : '—', timestamp: published?.getTime() ?? -Infinity
    }];
  }).sort((a, b) => b.timestamp - a.timestamp || a.id.localeCompare(b.id)).slice(0, maximum);
}
