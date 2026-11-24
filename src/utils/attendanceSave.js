export function savedAttendance(student, date) {
  const canonical = student.attendanceByDate?.[date]?.status;
  if (canonical === 'present' || canonical === 'absent') return canonical;
  const hasDate = value => typeof value === 'string' && value.split('::')[0] === date;
  if ((student.attendance || []).some(hasDate)) return 'present';
  if ((student.absentDates || []).some(hasDate)) return 'absent';
  return null;
}

export function attendanceUpdate(student, { date, status, expected, teacher, updatedAt, removed }) {
  const current = savedAttendance(student, date);
  if (current === status) return null; // Never claim another teacher's unchanged marking.
  if (current !== expected) throw new Error('Attendance changed while this form was open. Review the latest saved marks and try again.');
  const withoutDate = values => (values || []).filter(value => typeof value !== 'string' || value.split('::')[0] !== date);
  const attendance = withoutDate(student.attendance);
  const absentDates = withoutDate(student.absentDates);
  if (status === 'present') attendance.push(date);
  if (status === 'absent') absentDates.push(date);
  const allDates = [...attendance, ...absentDates].filter(value => typeof value === 'string').map(value => value.split('::')[0]).sort();
  const latest = allDates.at(-1);
  const present = new Set(attendance.map(value => typeof value === 'string' ? value.split('::')[0] : ''));
  let streak = 0;
  if (latest) {
    const cursor = new Date(`${latest}T00:00:00`);
    while (!Number.isNaN(cursor.getTime())) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      if (!present.has(key)) break;
      streak++; cursor.setDate(cursor.getDate() - 7);
    }
  }
  return { attendance, absentDates, currentStreak: streak,
    [`attendanceByDate.${date}`]: status ? { status, teacherName: teacher.name, teacherId: teacher.uid, updatedAt } : removed };
}
