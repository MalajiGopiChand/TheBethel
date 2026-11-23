import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Box, CircularProgress, Avatar, Dialog, DialogTitle, DialogContent, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { AttachMoney as DollarIcon, LocalFireDepartment as StreakIcon, CalendarMonth as CalendarIcon, Close as CloseIcon, ChatOutlined as ChatIcon, CampaignOutlined as NewsIcon, ArticleOutlined as NoteIcon } from '@mui/icons-material';
import {
  collection,
  query,
  orderBy,
  limit, // Added limit
  onSnapshot
} from "../../../services/notifyingFirestore";
import { parentAttendance, parentRewards, activityDate } from '../../../utils/parentActivity';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import AnnouncementsSection from '../../../components/AnnouncementsSection';
import { tParent } from '../../../utils/parentI18n';

const HomeTab = ({ student, parentLang = 'te' }) => {
  const label = (en, te) => parentLang === 'te' ? te : en;
  const [announcements, setAnnouncements] = useState([]);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

  useEffect(() => {
    // 1. QUERY FIX: Use 'date' to match Android App & Admin Panel
    // Added limit(5) so we don't fetch unnecessary history for the dashboard
    const notificationsQuery = query(
      collection(db, 'notifications'),
      orderBy('date', 'desc'),
      limit(5)
    );

    // 2. Real-time Listener
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const announcementsData = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const audience = data.audience || 'All';

        // 3. Audience Filter
        if (audience === 'Parents' || audience === 'All Students' || audience === 'All') {

          // 4. Robust Date Parsing (Handles 'date' field)
          // We check data.date first (Android standard), then fallback to createdAt
          const timestamp = data.date || data.createdAt;
          let dateObj;

          if (timestamp) {
            if (typeof timestamp.toDate === 'function') {
              dateObj = timestamp.toDate();
            } else if (timestamp instanceof Date) {
              dateObj = timestamp;
            } else {
              dateObj = new Date();
            }
          } else {
            dateObj = new Date();
          }

          announcementsData.push({
            id: doc.id,
            title: data.title || '',
            message: data.message || '',
            date: format(dateObj, 'MMM dd, yyyy'),
            audience: audience,
            isImportant: data.isImportant || false
          });
        }
      });
      setAnnouncements(announcementsData);
    }, (error) => {
      console.error("Error getting announcements:", error);
    });

    return () => unsubscribe();
  }, []); // Removed [student] dependency so it loads even if student data is delayed

  if (!student) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" color="text.secondary">
          Loading student data...
        </Typography>
        <CircularProgress sx={{ mt: 2 }} />
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

      <button type="button" className="portal-metric portal-points" onClick={() => setIsRewardModalOpen(true)}>
        <span className="portal-metric-title">🌟 {label('Dollar Points', 'డాలర్ పాయింట్లు')}</span>
        <strong>${student.dollarPoints || 0}</strong>
        <span className="portal-pill">{label('Tap to view history', 'చరిత్ర చూడండి')} <span aria-hidden="true">›</span></span>
        <span className="coin-art" aria-hidden="true"><i>★</i></span>
      </button>
      <button type="button" className="portal-metric portal-streak" onClick={() => setIsStreakModalOpen(true)}>
        <span className="portal-metric-title">🔥 {label('Current Streak', 'వరుస హాజరు')}</span>
        <strong>{student.currentStreak || 0}</strong>
        <span className="portal-pill">{label('Tap to view attendance', 'హాజరు చూడండి')} <span aria-hidden="true">›</span></span>
        <span className="flame-art" aria-hidden="true">🔥</span>
      </button>

      <section className="portal-help portal-surface">
        <ChatIcon aria-hidden="true" /><div><h2>{tParent(parentLang, 'complaints')}</h2><p>{label('Send a concern in English or Telugu.', 'ఇంగ్లీష్ లేదా తెలుగులో సమస్యను తెలియజేయండి.')}</p></div>
        <Link to="/parent/complaints">{tParent(parentLang, 'raiseNow')}</Link>
      </section>
      <section className="portal-updates"><h2><NewsIcon />{label('Latest Updates', 'తాజా సమాచారం')}</h2>
        {announcements.length ? <AnnouncementsSection announcements={announcements} /> : <div className="portal-empty portal-surface"><NoteIcon />{label('No new announcements.', 'కొత్త ప్రకటనలు లేవు.')}</div>}
      </section>

      {/* Rewards History Modal */}
      <Dialog
        open={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight="900" display="flex" alignItems="center" gap={1}>
             <DollarIcon color="warning" /> Dollar Points History
          </Typography>
          <IconButton onClick={() => setIsRewardModalOpen(false)} sx={{ bgcolor: 'action.hover' }}>
             <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {!rewards.length ? (
            <Box p={4} textAlign="center">
                <Avatar sx={{ mx: 'auto', bgcolor: 'transparent', color: 'text.secondary', width: 64, height: 64, mb: 2 }}>
                    <DollarIcon fontSize="large" />
                </Avatar>
                <Typography color="text.secondary" fontWeight="600">No rewards recorded yet.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Teacher</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rewards.map((reward, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{activityDate(reward.date)?.toLocaleDateString() || '—'}</TableCell>
                      <TableCell>
                          <Typography color="success.main" fontWeight="900">
                             +${reward.dollars}
                          </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{reward.reason || '-'}</TableCell>
                      <TableCell>
                          <Chip size="small" label={reward.teacher || reward.awardedBy || '-'} sx={{ fontWeight: 600, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Streak History Modal */}
      <Dialog
        open={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight="900" display="flex" alignItems="center" gap={1}>
             <StreakIcon color="error" /> Attendance Log
          </Typography>
          <IconButton onClick={() => setIsStreakModalOpen(false)} sx={{ bgcolor: 'action.hover' }}>
             <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {!attendanceList.length ? (
            <Box p={4} textAlign="center">
                <Avatar sx={{ mx: 'auto', bgcolor: 'transparent', color: 'text.secondary', width: 64, height: 64, mb: 2 }}>
                    <StreakIcon fontSize="large" />
                </Avatar>
                <Typography color="text.secondary" fontWeight="600">No attendance recorded yet.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {attendanceList.map((dateStr, i) => {
                    const teacherName = student.attendanceByDate?.[dateStr]?.teacherName || '-';
                    return (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{dateStr}</TableCell>
                        <TableCell>
                            <Chip size="small" label={teacherName} sx={{ fontWeight: 600, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', maxWidth: 120 }} />
                        </TableCell>
                        <TableCell align="right">
                            <Chip size="small" label="Present" sx={{ fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default HomeTab;
