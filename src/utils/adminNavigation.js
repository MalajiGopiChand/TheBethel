export const ADMIN_TABS = ['home', 'attendance', 'manage', 'staff', 'more'];

export function adminSection(pathname, search = '') {
  if (pathname === '/admin/dashboard') {
    const tab = new URLSearchParams(search).get('tab');
    return ADMIN_TABS.includes(tab) ? tab : 'home';
  }
  if (/settings|download|view-records/.test(pathname)) return 'more';
  if (/verify-teachers|registered-parents|timetable|schedule|finance|offerings|teacher-leaderboard|report-submission|teacher-progress|\/progress|\/profile/.test(pathname)) return 'staff';
  if (/attendance|absent-students|add-student|delete-student/.test(pathname)) return 'attendance';
  if (/students|student-details|leaderboard|dollar|rewards|homework/.test(pathname)) return 'manage';
  return 'home';
}

export const adminTabUrl = tab => `/admin/dashboard${tab === 'home' ? '' : `?tab=${tab}`}`;
