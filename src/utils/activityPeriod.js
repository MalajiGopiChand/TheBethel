// Only attendance and reward fields are reset. Identity and enrollment remain shared.
export const ACTIVITY_FIELDS = ['attendance', 'absentDates', 'attendanceByDate', 'rewards', 'dollarPoints', 'currentStreak'];
export function projectStudent(student, activity, periodId) {
  if (!student || !periodId) return student;
  return { ...student, attendance: [], absentDates: [], attendanceByDate: {}, rewards: [], dollarPoints: 0, currentStreak: 0,
    ...Object.fromEntries(ACTIVITY_FIELDS.filter(key => activity && Object.hasOwn(activity, key)).map(key => [key, activity[key]])) };
}
export function splitStudentUpdate(update) {
  const profile = {}, activity = {};
  for (const [key, value] of Object.entries(update)) {
    (ACTIVITY_FIELDS.includes(key.split('.')[0]) ? activity : profile)[key] = value;
  }
  return { profile, activity };
}
export function expandFieldPaths(update) {
  const result = {};
  for (const [path, value] of Object.entries(update)) {
    const parts = path.split('.');
    let target = result;
    for (const part of parts.slice(0, -1)) target = target[part] ||= {};
    target[parts.at(-1)] = value;
  }
  return result;
}
