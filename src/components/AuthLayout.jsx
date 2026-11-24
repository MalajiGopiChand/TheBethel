import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { VisibilityOutlined, VisibilityOffOutlined, ArrowBackRounded, CheckCircleOutlineRounded } from '@mui/icons-material';
import SchoolArtwork from './SchoolArtwork';
import '../styles/auth-experience.css';

const stories = {
  teacher: ['A little guidance. A lifetime of growth.', 'Bring your classroom together, celebrate progress and make every Sunday count.', 'Attendance, lessons & rewards'],
  parent: ['Every little step, a reason to smile.', 'Stay close to your child’s Sunday school journey, from new lessons to proud little moments.', 'Your child’s journey, together'],
  admin: ['A caring school starts with you.', 'Keep your community connected, your school organised and every child’s progress in view.', 'Your school, beautifully connected'],
};
export function AuthPasswordField({ newPassword = false, InputProps, inputProps, ...props }) {
  const [visible, setVisible] = useState(false);
  return <TextField {...props} type={visible ? 'text' : 'password'} autoComplete={newPassword ? 'new-password' : 'current-password'} inputProps={{ minLength: newPassword ? 6 : undefined, ...inputProps }} InputProps={{ ...InputProps, endAdornment: <InputAdornment position="end"><IconButton edge="end" size="small" aria-label={`${visible ? 'Hide' : 'Show'} ${(props.label || 'password').toLowerCase()}`} onMouseDown={event => event.preventDefault()} onClick={() => setVisible(value => !value)}>{visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton></InputAdornment> }} />;
}
export default function AuthLayout({ role, signup = false, children }) {
  const [headline, description, note] = stories[role];
  return <div className={`auth-experience auth-experience--${role}${signup ? ' auth-experience--signup' : ''}`}>
    <div className="auth-layout">
      <section className="auth-story" aria-label="Welcome to Bethel">
        <Link to="/" className="auth-brand"><img src="/image.png" alt="" /><span>Bethel<strong>Attendance App</strong></span></Link>
        <div className="auth-story-copy"><span className="auth-eyebrow">Growing in faith. Learning together.</span><h2>{headline}</h2><p>{description}</p></div>
        <SchoolArtwork name="hero" className="auth-scene" />
        <span className="auth-story-note"><CheckCircleOutlineRounded />{note}</span>
        <i className="auth-spark auth-spark--one" aria-hidden="true">✦</i><i className="auth-spark auth-spark--two" aria-hidden="true">✧</i>
      </section>
      <section className="auth-form-panel">
        <Link to="/" className="auth-change-role"><ArrowBackRounded />Change portal</Link>
        <header className="auth-form-heading"><span className="auth-role-pill">{role === 'parent' ? 'Parent' : role === 'admin' ? 'Admin' : 'Teacher'} portal</span><h1>{signup ? 'Create your account' : 'Welcome back'}</h1><p>{signup ? (role === 'teacher' ? 'Join the team helping young hearts grow.' : 'Follow your child’s learning journey with us.') : `Sign in to your ${role} account to continue.`}</p></header>
        {signup && <p className="auth-registration-note">{role === 'teacher' ? 'Your teacher account will be reviewed by an administrator.' : 'Have your child’s school roll number ready to link their profile.'}</p>}
        <div className="auth-form-content">{children}</div>
        <p className="auth-footer-note">The Bethel Church · Sunday School</p>
      </section>
    </div>
  </div>;
}
