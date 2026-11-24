import React from 'react';
import { Link } from 'react-router-dom';
import { SchoolOutlined, FamilyRestroomOutlined, AdminPanelSettingsOutlined, ArrowForwardRounded } from '@mui/icons-material';
import SchoolArtwork from '../../components/SchoolArtwork';
import '../../styles/auth-experience.css';

const portals = [
  ['teacher', 'Teacher', 'Guide your class and celebrate every step.', SchoolOutlined],
  ['parent', 'Parent', 'Follow your child’s learning journey.', FamilyRestroomOutlined],
  ['admin', 'Administrator', 'Bring your school community together.', AdminPanelSettingsOutlined],
];
export default function RoleSelection() {
  return <main className="auth-role-selection">
    <div className="auth-role-container">
      <Link to="/" className="auth-brand"><img src="/image.png" alt="" /><span>Bethel<strong>Attendance App</strong></span></Link>
      <header><span className="auth-eyebrow">A place to learn. A community to grow.</span><h1>Welcome to Bethel</h1><p>Choose your portal to get started.</p></header>
      <SchoolArtwork name="hero" className="auth-role-landscape" />
      <nav aria-label="Choose your portal" className="auth-role-options">{portals.map(([role, label, description, Icon]) => <Link key={role} to={`/auth/${role}/login`} className={`auth-role-option auth-role-option--${role}`}><span className="auth-role-icon"><Icon /></span><span><strong>{label}</strong><small>{description}</small></span><ArrowForwardRounded /></Link>)}</nav>
      <div className="auth-role-registration"><p>New to our school community?</p><Link to="/auth/teacher/signup">Create teacher account</Link><span aria-hidden="true">·</span><Link to="/auth/parent/signup">Create parent account</Link></div>
      <p className="auth-footer-note">The Bethel Church · Sunday School</p>
    </div>
  </main>;
}
