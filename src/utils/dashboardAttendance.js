import { format, startOfWeek, subDays } from 'date-fns';

/** Sunday at the start of the calendar week (Sun–Sat). */
export function getWeekSundayDate(ref = new Date()) {
  return startOfWeek(ref, { weekStartsOn: 0 });
}

export function getStudentAttendanceStatus(student, dateStr) {
  const byDate = student.attendanceByDate || {};
  const record = byDate[dateStr];
  if (record?.status === 'present' || record?.status === 'absent') {
    return record.status;
  }

  const attendanceList = student.attendance || [];
  const absentDates = student.absentDates || [];

  const isPresent = attendanceList.some(
    (v) => v === dateStr || (typeof v === 'string' && v.startsWith(`${dateStr}::`))
  );
  if (isPresent) return 'present';

  const isAbsent = absentDates.some(
    (v) => v === dateStr || (typeof v === 'string' && v.startsWith(`${dateStr}::`))
  );
  if (isAbsent) return 'absent';

  return null;
}

const countForSunday = (students, dateStr) => {
  let present = 0;
  let absent = 0;

  students.forEach((student) => {
    const status = getStudentAttendanceStatus(student, dateStr);
    if (status === 'present') present += 1;
    else if (status === 'absent') absent += 1;
  });

  return { present, absent };
};

/**
 * Dashboard shows Sunday-school attendance for the current week (Sun–Sat).
 * If this week's Sunday has no marks yet, keep showing the previous Sunday
 * until Saturday night / new marks are saved.
 */
export function getDashboardAttendanceStats(students, ref = new Date()) {
  const thisSunday = getWeekSundayDate(ref);
  const thisSundayStr = format(thisSunday, 'yyyy-MM-dd');
  const thisWeek = countForSunday(students, thisSundayStr);
  const hasMarksThisWeek = thisWeek.present > 0 || thisWeek.absent > 0;

  let activeSunday = thisSunday;
  let counts = thisWeek;

  if (!hasMarksThisWeek) {
    activeSunday = subDays(thisSunday, 7);
    const prevStr = format(activeSunday, 'yyyy-MM-dd');
    counts = countForSunday(students, prevStr);
  }

  const dateStr = format(activeSunday, 'yyyy-MM-dd');
  const totalStudents = students.length;
  const attendancePercentage =
    totalStudents > 0 ? Math.round((counts.present / totalStudents) * 100) : 0;

  return {
    dateStr,
    dateLabel: format(activeSunday, 'dd MMM yyyy'),
    todayPresentCount: counts.present,
    todayAbsentCount: counts.absent,
    attendancePercentage,
    isCurrentWeekSunday: hasMarksThisWeek
  };
}
