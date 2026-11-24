import SchoolLoader from '../../../components/SchoolLoader';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Box } from '@mui/material';
import { CalendarMonth as CalendarIcon, ChatOutlined as ChatIcon, CampaignOutlined as NewsIcon } from '@mui/icons-material';
import { parentAttendance, parentRewards } from '../../../utils/parentActivity';
import ParentHistoryDialog from './ParentHistoryDialog';
import ParentAnnouncements from './ParentAnnouncements';
import { tParent } from '../../../utils/parentI18n';

const HomeTab = ({ student, parentLang = 'te' }) => {
  const label = (en, te) => parentLang === 'te' ? te : en;
  const [history, setHistory] = useState(null);

  if (!student) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" color="text.secondary">
          Loading student data...
        </Typography>
        <SchoolLoader />
      </Box>
    );
  }

  // Calculations
  const records = parentAttendance(student);
  const attendanceList = records.filter(record => record.status === "present").map(record => record.date);
  const rewards = parentRewards(student);
  const absentDates = records.filter(record => record.status === "absent");
  const totalDays = attendanceList.length + absentDates.length;
  const attendancePercentage = totalDays > 0
    ? Math.round((attendanceList.length / totalDays) * 100)
    : 0;

  return (
    <div className="portal-feed">
      <section className="portal-hero">
        <div className="portal-family" aria-hidden="true"><i /><i /></div>
        <h1>{label('Welcome back,', 'స్వాగతం,')}<br />{student.name} <small>👋</small></h1>
        <div className="portal-date"><CalendarIcon fontSize="small" />{new Date().toLocaleDateString(parentLang === 'te' ? 'te-IN' : 'en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <Link className="portal-pill" to="/parent/child">{label('My Child Details', 'నా పిల్లవాడి వివరాలు')} <span aria-hidden="true">›</span></Link>
      </section>

      <section className="portal-attendance portal-surface">
        <div className="calendar-art" aria-hidden="true"><i>✓</i></div>
        <div className="portal-attendance-data">
          <h2>{label('Attendance', 'హాజరు')}</h2>
          <div className="portal-ring" style={{ '--attendance': attendancePercentage + '%' }}><b>{attendancePercentage}%</b></div>
          <div className="portal-counts">
            <div><b>{attendanceList.length}</b>{label('Present', 'హాజరు')}</div>
            <div><b>{absentDates.length}</b>{label('Absent', 'గైర్హాజరు')}</div>
          </div>
        </div>
      </section>

      <button type="button" className="portal-metric portal-points" onClick={() => setHistory('points')}>
        <span className="portal-metric-title">🌟 {label('Dollar Points', 'డాలర్ పాయింట్లు')}</span>
        <strong>${student.dollarPoints || 0}</strong>
        <span className="portal-pill">{label('Tap to view history', 'చరిత్ర చూడండి')} <span aria-hidden="true">›</span></span>
        <span className="coin-art" aria-hidden="true"><i>★</i></span>
      </button>
      <button type="button" className="portal-metric portal-streak" onClick={() => setHistory('attendance')}>
        <span className="portal-metric-title">🔥 {label('Current Streak', 'వరుస హాజరు')}</span>
        <strong>{student.currentStreak || 0}</strong>
        <span className="portal-pill">{label('Tap to view attendance', 'హాజరు చూడండి')} <span aria-hidden="true">›</span></span>
        <span className="flame-art" aria-hidden="true">🔥</span>
      </button>

      <section className="portal-help portal-surface">
        <ChatIcon aria-hidden="true" /><div><h2>{tParent(parentLang, 'complaints')}</h2><p>{label('Send a concern in English or Telugu.', 'ఇంగ్లీష్ లేదా తెలుగులో సమస్యను తెలియజేయండి.')}</p></div>
        <Link to="/parent/complaints">{tParent(parentLang, 'raiseNow')}</Link>
      </section>
      <section className="portal-updates">
        <div className="portal-updates-heading"><h2><NewsIcon />{label('Announcements', 'ప్రకటనలు')}</h2>
          <Link to="/parent/notifications">{label('View all', 'అన్నీ చూడండి')}</Link></div>
        <ParentAnnouncements parentLang={parentLang} maximum={5} />
      </section>

      {history && <ParentHistoryDialog kind={history} rewards={rewards} records={records}
        parentLang={parentLang} onClose={() => setHistory(null)} />}
    </div>
  );
};

export default HomeTab;
