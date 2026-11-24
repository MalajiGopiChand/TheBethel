import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dismissLaunchScreen } from '../utils/launchScreen';

export function AppLaunchStatus() {
  const { currentUser, loading } = useAuth();
  useEffect(() => {
    const screen = document.getElementById('app-launch-screen');
    if (!screen) return;
    let previous;
    try { previous = localStorage.getItem('bethel-launch-role'); } catch { /* Storage is optional. */ }
    const routeRole = window.location.pathname.match(/(?:auth\/)?(teacher|admin|parent)\//)?.[1];
    const role = (currentUser?.role || routeRole || previous || '').toLowerCase();
    screen.dataset.role = role;
    const label = document.getElementById('app-launch-message');
    if (label) label.textContent = { admin: 'Preparing your school overview', teacher: 'Getting your classroom ready', parent: 'Bringing your child’s latest updates' }[role] || 'A new day to learn and grow';
    if (!loading && currentUser?.role) try { localStorage.setItem('bethel-launch-role', role); } catch { /* Storage is optional. */ }
  }, [currentUser?.role, loading]);
  return null;
}
// Committed inside Suspense: the splash remains until the initial route is ready.
export function LaunchReady() {
  useEffect(() => { dismissLaunchScreen(); }, []);
  return null;
}
