import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeRounded, FactCheckOutlined, EmojiEventsOutlined, SchoolOutlined, PersonOutlineRounded, ManageAccountsOutlined, SettingsOutlined, CampaignOutlined, ChatOutlined, AssignmentOutlined } from '@mui/icons-material';
import { adminSection, adminTabUrl, ADMIN_TABS } from '../utils/adminNavigation';

export default function DesktopPortalNavigation({ user }) {
  const { pathname, search } = useLocation();
  const role = user.role.toLowerCase();
  const params = new URLSearchParams(search);
  let items;
  if (role === 'admin') {
    const icons = [HomeRounded, FactCheckOutlined, ManageAccountsOutlined, SchoolOutlined, SettingsOutlined];
    items = ADMIN_TABS.map((key, index) => ({ label: ['Home', 'Attendance', 'Manage', 'Staff', 'More'][index], path: adminTabUrl(key), icon: icons[index], active: adminSection(pathname, search) === key }));
  } else if (role === 'teacher') {
    const tab = Number(params.get('tab') || 0);
    items = [
      ['Home', '/teacher/dashboard', HomeRounded, pathname === '/teacher/dashboard' && tab === 0],
      ['Attendance', '/teacher/dashboard?tab=1', FactCheckOutlined, /attendance|absent-students/.test(pathname) || (pathname === '/teacher/dashboard' && tab === 1)],
      ['Rewards', '/teacher/dashboard?tab=2', EmojiEventsOutlined, (/dollar/.test(pathname) || ['/teacher/leaderboard', '/teacher/student-leaderboard'].includes(pathname)) || (pathname === '/teacher/dashboard' && tab === 2)],
      ['Teachers', '/teacher/dashboard?tab=3', SchoolOutlined, /schedule|offerings|report-submission|teacher-progress|teacher-leaderboard|student-details/.test(pathname) || (pathname === '/teacher/dashboard' && tab === 3)],
      ['Homework', '/teacher/homework', AssignmentOutlined, pathname.includes('/homework')],
      ['My profile', '/teacher/profile', PersonOutlineRounded, pathname.includes('/profile')],
    ].map(([label, path, icon, active]) => ({ label, path, icon, active }));
  } else {
    const tab = params.get('tab') || 'home';
    items = [
      ['Home', '/parent/dashboard', HomeRounded, pathname === '/parent/dashboard' && tab === 'home'],
      ['Homework', '/parent/dashboard?tab=homework', AssignmentOutlined, pathname === '/parent/dashboard' && tab === 'homework'],
      ['Leaderboard', '/parent/dashboard?tab=leaderboard', EmojiEventsOutlined, pathname === '/parent/dashboard' && tab === 'leaderboard'],
      ['My profile', '/parent/dashboard?tab=profile', PersonOutlineRounded, pathname === '/parent/dashboard' && tab === 'profile'],
      ['Updates', '/parent/notifications', CampaignOutlined, pathname.includes('/notifications')],
      ['Support', '/parent/complaints', ChatOutlined, pathname.includes('/complaints')],
    ].map(([label, path, icon, active]) => ({ label, path, icon, active }));
  }
  return <aside className="desktop-portal-nav" aria-label={`${role} workspace`}>
    <Link className="desktop-brand" to={`/${role}/dashboard`}><img src="/image.png" alt="" /><span>Bethel<span>Attendance App</span></span></Link>
    <p className="desktop-nav-caption">{role === 'parent' ? 'Family' : role === 'admin' ? 'School' : 'Teacher'} workspace</p>
    <nav aria-label={`${role} desktop navigation`}>{items.map(({ label, path, icon: Icon, active }) => <Link key={label} to={path} aria-current={active ? 'page' : undefined}><Icon /><span>{label}</span>{active && <i aria-hidden="true" />}</Link>)}</nav>
    <div className="desktop-nav-footer"><span className="desktop-user-initial">{(user.name || role)[0].toUpperCase()}</span><span><strong>{user.name || 'Welcome'}</strong><small>{role[0].toUpperCase() + role.slice(1)} portal</small></span></div>
  </aside>;
}
