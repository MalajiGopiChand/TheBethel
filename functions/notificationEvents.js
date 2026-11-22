export function attendanceMap(student = {}) {
  const result = {};
  for (const value of student.attendance || []) result[String(value).split('::')[0]] = 'present';
  for (const value of student.absentDates || []) result[String(value).split('::')[0]] = 'absent';
  for (const [date, record] of Object.entries(student.attendanceByDate || {})) {
    if (['present', 'absent'].includes(record?.status)) result[date] = record.status;
  }
  return result;
}
export function dollarTotal(student = {}) {
  // Mirrors legacy app behavior; a positive rewards sum takes precedence.
  const rewards = (student.rewards || []).reduce((sum, entry) => sum + (Number(entry.dollars) || 0), 0);
  return rewards > 0 ? rewards : Number(student.dollarPoints) || 0;
}
export function activityChanges(before = {}, after = {}, name = 'Your child') {
  const changes = [];
  const oldAttendance = attendanceMap(before), newAttendance = attendanceMap(after);
  const dates = [...new Set([...Object.keys(oldAttendance), ...Object.keys(newAttendance)])].filter(date => oldAttendance[date] !== newAttendance[date]).sort();
  if (dates.length) {
    const date = dates.at(-1);
    changes.push({ type: 'attendance', title: `Attendance: ${name}`, body: `${name} was marked ${newAttendance[date] || 'unmarked'} for ${date}${dates.length > 1 ? ` (${dates.length} dates updated)` : ''}.` });
  }
  const previous = dollarTotal(before), total = dollarTotal(after);
  if (previous !== total || JSON.stringify(before.rewards || []) !== JSON.stringify(after.rewards || [])) {
    const delta = total - previous;
    changes.push({ type: 'dollars', title: `Dollars: ${name}`, body: delta > 0 ? `${name} received ${delta} dollars. Current total: ${total}.` : `${name}'s dollar records were updated. Current total: ${total}.` });
  }
  return changes;
}
const normalize = value => String(value || '').trim().toLowerCase();
export function homeworkMatches(student, homework) {
  return (!homework.classType || normalize(homework.classType) === 'all' || normalize(student.classType) === normalize(homework.classType)) &&
    (!homework.place || normalize(homework.place) === 'all' || normalize(student.place || student.location) === normalize(homework.place));
}
export function audienceMatches(person, audience) {
  const value = normalize(audience);
  if (value === 'all') return true;
  if (['parent', 'parents', 'all students', 'students'].includes(value)) return person.role === 'PARENT';
  if (['teacher', 'teachers'].includes(value)) return person.role === 'TEACHER';
  if (['admin', 'admins', 'administrator', 'administrators'].includes(value)) return person.role === 'ADMIN';
  // Named audiences must never fall back to broadcasting to everyone.
  return Boolean(value) && normalize(person.name) === value;
}
