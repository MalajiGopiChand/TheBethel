import React from 'react';
import SchoolArtwork from './SchoolArtwork';
import './school-loader.css';

export default function SchoolLoader({ role, message, compact = false, inline = false }) {
  if (inline) return <span role="status" className="school-working">{message || 'Working'}<span aria-hidden="true">…</span></span>;
  const route = typeof window !== 'undefined' ? window.location.pathname : '';
  const kind = String(role || (typeof document !== 'undefined' && document.documentElement.dataset.appRole) || (route.includes('/parent') ? 'parent' : route.includes('/admin') ? 'admin' : 'teacher')).toLowerCase();
  const text = message || ({ admin: 'Preparing your school overview', teacher: 'Getting your classroom ready', parent: "Bringing your child’s latest updates" }[kind] || 'Preparing your school updates');
  return <div className={`school-loader ${compact ? 'school-loader--compact' : ''}`} role="status" aria-live="polite">
    <SchoolArtwork name={kind === 'parent' ? 'students' : kind === 'admin' ? 'clipboard' : 'books'} className="school-loader-art" />
    <span>{text}<span className="school-loader-dots" aria-hidden="true"><i /><i /><i /></span></span>
    {!compact && <div className="school-loader-track" aria-hidden="true"><span /></div>}
  </div>;
}
