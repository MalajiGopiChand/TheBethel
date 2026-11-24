// Activity is attributed by account ID first. Names are only a fallback for
// older records, and only when that name identifies exactly one teacher.
export const isActivityAdmin = user => user?.role === 'ADMIN' || ['gop1@gmail.com', 'premkumartenali@gmail.com'].includes(user?.email);
const normalize = value => String(value || '').trim().toLocaleLowerCase();
export function activityDate(value) {
  if (value == null || value === '') return null;
  const date = typeof value?.toDate === 'function' ? value.toDate()
    : typeof value?.seconds === 'number' ? new Date(value.seconds * 1000)
      : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`)
        : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
export function activityDay(value) {
  const date = activityDate(value);
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
}
export function belongsToTeacher(record, teacher, teachers = []) {
  if (!teacher?.uid) return false;
  const ids = ['teacherUid', 'teacherId', 'createdByUid', 'recordedByUid'].map(key => record?.[key]).filter(Boolean);
  // recordedBy is an account ID in current finance records. Legacy names remain supported.
  if (record?.recordedBy && (!record.createdBy || record.recordedBy !== record.createdBy)) ids.push(record.recordedBy);
  if (ids.length) return ids.every(id => id === teacher.uid);
  const names = [teacher.name, teacher.displayName].map(normalize).filter(Boolean);
  const recordName = normalize(record?.teacherName || record?.teacher || record?.createdByName || record?.createdBy || record?.recordedBy);
  if (!names.includes(recordName)) return false;
  const matches = teachers.filter(item => [item.name, item.displayName].map(normalize).includes(recordName));
  return matches.length === 1 && matches[0].uid === teacher.uid;
}
export function teacherRewards(students, teacher, teachers) {
  return students.flatMap(student => (Array.isArray(student.rewards) ? student.rewards : []).flatMap((reward, index) => {
    if (!belongsToTeacher(reward, teacher, teachers)) return [];
    const amount = Number(reward.dollars ?? reward.amount);
    if (!Number.isFinite(amount)) return [];
    return [{ ...reward, id: `${student.id}:${reward.id || index}`, amount, studentKey: student.id, studentName: student.name || 'Student', studentId: student.studentId || student.id, dateValue: reward.createdAt || reward.awardedAt || reward.date }];
  })).sort(newestActivity);
}
export function newestActivity(a, b) {
  return (activityDate(b.dateValue || b.createdAt || b.timestamp || b.date)?.getTime() || 0) - (activityDate(a.dateValue || a.createdAt || a.timestamp || a.date)?.getTime() || 0);
}
export function teacherAttendanceDays(students, teacher, teachers) {
  const days = new Set(Object.keys(teacher?.attendanceSessions || {}).filter(date => teacher.attendanceSessions[date]?.marked === true));
  for (const student of students) {
    for (const [date, entry] of Object.entries(student.attendanceByDate || {})) {
      if (['present', 'absent'].includes(entry?.status) && belongsToTeacher(entry, teacher, teachers)) days.add(date);
    }
    for (const entry of [...(student.attendance || []), ...(student.absentDates || [])]) {
      if (typeof entry !== 'string' || !entry.includes('::')) continue;
      const [date, ...name] = entry.split('::');
      // Canonical records supersede the legacy arrays for the same date.
      if (!student.attendanceByDate?.[date] && belongsToTeacher({ teacherName: name.join('::') }, teacher, teachers)) days.add(date);
    }
  }
  return new Set([...days].filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day) && activityDate(day)?.getDay() === 0));
}
export function sundayActivity(month, markedDays, today = new Date()) {
  if (!/^\d{4}-\d{2}$/.test(month)) return [];
  const [year, number] = month.split('-').map(Number);
  if (number < 1 || number > 12) return [];
  const result = [];
  for (let date = new Date(year, number - 1, 1); date.getMonth() === number - 1; date.setDate(date.getDate() + 1)) {
    if (date.getDay() === 0 && activityDay(date) <= activityDay(today)) result.push({ date: activityDay(date), marked: markedDays.has(activityDay(date)) });
  }
  return result.reverse();
}
