export function activityDate(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value :
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return value != null && !Number.isNaN(date.getTime()) ? date : null;
}
export function parentAttendance(student = {}) {
  const entries = new Map();
  for (const value of Array.isArray(student.attendance) ? student.attendance : []) {
    const date = typeof value === 'string' ? value.split('::')[0] : value?.date;
    if (date) entries.set(date, { date, status: 'present' });
  }
  for (const value of Array.isArray(student.absentDates) ? student.absentDates : []) {
    const date = typeof value === 'string' ? value.split('::')[0] : value?.date;
    if (date) entries.set(date, { date, status: 'absent' });
  }
  for (const [date, record] of Object.entries(student.attendanceByDate || {})) {
    const status = typeof record === 'string' ? record : record?.status;
    if (typeof status === 'string' && ['present', 'absent'].includes(status.toLowerCase())) entries.set(date, { date, status: status.toLowerCase() });
  }
  return [...entries.values()].sort((a, b) => (activityDate(b.date)?.getTime() || 0) - (activityDate(a.date)?.getTime() || 0));
}
export const parentRewards = student => (Array.isArray(student?.rewards) ? student.rewards : []).filter(Boolean).slice()
  .sort((a, b) => (activityDate(b.date)?.getTime() || 0) - (activityDate(a.date)?.getTime() || 0));
