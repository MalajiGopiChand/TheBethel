import test from 'node:test';
import assert from 'node:assert/strict';
import { parentAnnouncements } from '../src/utils/parentAnnouncements.js';

const doc = (id, fields) => ({ id, data: () => fields });

test('parent preview filters audiences before limiting and merges both publication dates', () => {
  const docs = [
    ...Array.from({ length: 6 }, (_, i) => doc('staff-' + i, { audience: 'Teachers', createdAt: '2026-11-24' })),
    doc('private', { audience: 'Named Teacher', createdAt: '2026-11-24' }),
    doc('old', { audience: 'All Students', date: '2026-11-21' }),
    doc('admin-post', { audience: 'Parents', createdAt: { toDate: () => new Date('2026-11-23T12:00:00Z') }, sender: 'School Office' }),
    doc('legacy', { date: '2026-11-22' })
  ];
  const preview = parentAnnouncements(docs, 'en-IN', 2);
  assert.deepEqual(preview.map(item => item.id), ['admin-post', 'legacy']);
  assert.equal(preview[0].sender, 'School Office');
  assert.match(preview[0].date, /2026/);
  assert.deepEqual(parentAnnouncements(docs, 'te-IN').map(item => item.id), ['admin-post', 'legacy', 'old']);
});
