export function activityDate(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value :
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return value != null && !Number.isNaN(date.getTime()) ? date : null;
}
export function parentAttendance(student = {}) {
  const entries = new Map();
  function addRecord(date, status, teacherName) {
    if (!date) return;
    const previous = entries.get(date);
    const teacher = teacherName || (previous?.status === status && previous.teacherName);
    const record = { date, status };
    if (teacher) record.teacherName = teacher;
    entries.set(date, record);
  }
  for (const [values, status] of [[student.attendance, 'present'], [student.absentDates, 'absent']]) {
    for (const value of Array.isArray(values) ? values : []) {
      if (typeof value === 'string') {
        const [date, ...name] = value.split('::');
        addRecord(date, status, name.join('::'));
      } else {
        addRecord(value?.date, status, value?.teacherName);
      }
    }
  }
  for (const [date, record] of Object.entries(student.attendanceByDate || {})) {
    const status = typeof record === 'string' ? record : record?.status;
    if (typeof status === 'string' && ['present', 'absent'].includes(status.toLowerCase())) {
      addRecord(date, status.toLowerCase(), record?.teacherName);
    }
  }
  return [...entries.values()].sort((a, b) => (activityDate(b.date)?.getTime() || 0) - (activityDate(a.date)?.getTime() || 0));
}
export const parentRewards = student => (Array.isArray(student?.rewards) ? student.rewards : []).filter(Boolean).slice()
  .sort((a, b) => (activityDate(b.date)?.getTime() || 0) - (activityDate(a.date)?.getTime() || 0));
