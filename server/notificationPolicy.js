export const ADMIN_EMAILS = ['gop1@gmail.com', 'premkumartenali@gmail.com'];
export function allowedPath(path) {
  return typeof path === 'string' && path.length < 500 && !path.includes('..') && (
    /^(students|homeworks|complaints|notifications|timetables|teacherProgress|teachers|offerings|expenses)\/[^/]+$/.test(path) ||
    /^chats\/chat_global_room\/messages\/[^/]+$/.test(path) ||
    /^website_activity\/[^/]+\/students\/[^/]+$/.test(path)
  );
}
export function mayNotify(path, user, teacher, parent, record) {
  if (!allowedPath(path)) return false;
  const admin = user.admin === true || ADMIN_EMAILS.includes(user.email);
  if (admin) return true;
  if (path.startsWith('complaints/')) return !!parent && (!record || record.parentId === user.uid);
  if (path.startsWith('teachers/')) return path === `teachers/${user.uid}`;
  return user.teacher === true || teacher?.approvalState === 'approved' ||
    (!['pending', 'rejected'].includes(teacher?.approvalState) && (teacher?.isVerified === true || teacher?.isApproved === true));
}
export function matchPattern(pattern, path) {
  const a = pattern.split('/'), b = path.split('/');
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith('{')) params[a[i].slice(1, -1)] = b[i];
    else if (a[i] !== b[i]) return null;
  }
  return params;
}
