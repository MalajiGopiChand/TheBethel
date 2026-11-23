import './student-details.css';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, CircularProgress, TextField, Grid, Chip,
  Alert, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Divider
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  AttachMoney as DollarIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  SchoolOutlined as SchoolIcon, LocationOnOutlined as LocationIcon, FamilyRestroom as FamilyIcon, Tag as IdIcon,
  TrendingUp as TrendIcon, LocalFireDepartmentOutlined as FlameIcon, CardGiftcard as GiftIcon,
  FactCheck as AttendanceIcon
} from '@mui/icons-material';
import {
  doc, onSnapshot, collection, query, where, updateDoc
} from '../../../services/studentData';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types';
import { handleBackNavigation } from '../../../utils/navigation';
import { studentDetailsId } from '../../../utils/studentDetailsAccess';
import { activityDate, parentAttendance, parentRewards } from '../../../utils/parentActivity';
import { 
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, addMonths, subMonths,
  isToday, isThisWeek, isThisMonth
} from 'date-fns';

const StudentDetailsPage = () => {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  
  const { currentUser } = useAuth();
  const parent = useOutletContext();
  const isParentView = currentUser?.role === UserRole.PARENT;
  const studentId = studentDetailsId(currentUser, searchParams.get('id'));
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [rewards, setRewards] = useState([]);
  const [unifiedAttendance, setUnifiedAttendance] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  
  const isAdmin = !isParentView && (currentUser?.role === UserRole.ADMIN || currentUser?.email === 'gop1@gmail.com' || currentUser?.email === 'premkumartenali@gmail.com');
  
  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Attendance Details Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const studentDocPhone = String(
    student?.parentPhone ||
    student?.mobileNumber ||
    student?.phone ||
    student?.phoneNumber ||
    student?.contactNumber ||
    student?.parentContact ||
    student?.fatherPhone ||
    student?.motherPhone ||
    ''
  ).trim();
  const resolvedPhone = studentDocPhone || '';

  const calculateDollarPoints = (studentData) => {
    const rewardsList = Array.isArray(studentData.rewards) ? studentData.rewards : [];
    let calculatedPoints = 0;
    for (const reward of rewardsList) {
      const points = reward?.dollars;
      if (typeof points === 'number') {
        calculatedPoints += points;
      } else if (typeof points === 'string') {
        calculatedPoints += parseInt(points) || 0;
      }
    }
    return calculatedPoints > 0 ? calculatedPoints : (studentData.dollarPoints || 0);
  };

  const handleBack = () => {
    handleBackNavigation(navigate, currentUser, isParentView ? '/parent/dashboard' : '/teacher/view-students');
  };

  const renderPageHeader = (title, rightAction = null) => (
    <Paper elevation={2} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
      <Button startIcon={<BackIcon />} onClick={handleBack}>
        Back
      </Button>
      <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold', fontSize: { xs: 18, sm: 24 } }}>
        {title}
      </Typography>
      <Box sx={{ minWidth: isParentView ? 0 : 90, textAlign: 'right' }}>{rightAction}</Box>
    </Paper>
  );

  useEffect(() => {
    setStudent(null);
    setLoadError('');
    if (isParentView && parent) {
      if (parent.student) loadStudentData(parent.student);
      else setLoading(parent.loadingStudent);
      if (parent.studentError) setLoadError('Could not load student details. Please check your connection and try again.');
      return;
    }
    if (!studentId) {
        setLoading(false);
        return;
    }

    setLoading(true);
    let unsubscribe;
    let stopFallback;
    const failed = () => { setStudent(null); setLoading(false); setLoadError('Could not load student details. Please check your connection and try again.'); };

    const q = query(collection(db, 'students'), where('studentId', '==', studentId));
    
    unsubscribe = onSnapshot(q, (snapshot) => {
        if (stopFallback) { stopFallback(); stopFallback = undefined; }
        if (!snapshot.empty) {
            const rawData = snapshot.docs[0].data();
            loadStudentData({ id: snapshot.docs[0].id, ...rawData });
        } else {
             const docRef = doc(db, 'students', studentId);
             stopFallback = onSnapshot(docRef, (docSnap) => {
                 if (docSnap.exists()) {
                     loadStudentData({ id: docSnap.id, ...docSnap.data() });
                 } else {
                     setStudent(null);
                     setLoading(false);
                 }
             }, failed);
        }
    }, failed);

    return () => { if (unsubscribe) unsubscribe(); if (stopFallback) stopFallback(); };
  }, [studentId, isParentView, parent?.student, parent?.studentError, parent?.loadingStudent]);

  useEffect(() => {
    if (!isParentView || !student) return;
    const section = searchParams.get('section');
    if (!['attendance', 'dollars', 'performance'].includes(section)) return;
    const frame = requestAnimationFrame(() => document.getElementById(`child-${section}`)?.scrollIntoView({ block: 'start', behavior: 'auto' }));
    return () => cancelAnimationFrame(frame);
  }, [isParentView, student, searchParams]);

  const loadStudentData = (data) => {
     const calculatedPoints = calculateDollarPoints(data);
     const completeData = { ...data, dollarPoints: calculatedPoints };
     setStudent(completeData);
     
     setUnifiedAttendance(parentAttendance(data)
       .filter(record => typeof record.date === 'string' && !Number.isNaN(parseISO(record.date).getTime()))
       .map(record => ({
         ...record,
         markedBy: record.teacherName || '—',
         markedAt: activityDate(data.attendanceByDate?.[record.date]?.updatedAt)
       })));

     // Process Rewards
     const rewardsList = parentRewards(completeData);
     setRewards(rewardsList);
     setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (isParentView) return;
    if (searchInput.trim()) {
        setSearchParams({ id: searchInput.trim() });
    }
  };

  const handleEditClick = () => {
    if (!isAdmin) return;
    setEditData({
      name: student.name || '',
      studentId: student.studentId || '',
      classType: student.classType || '',
      location: student.location || student.place || '',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      parentPhone: resolvedPhone || '',
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'students', student.id);
      await updateDoc(docRef, {
        name: editData.name,
        studentId: editData.studentId,
        classType: editData.classType,
        location: editData.location,
        place: editData.location,
        fatherName: editData.fatherName,
        motherName: editData.motherName,
        parentPhone: editData.parentPhone,
        mobileNumber: editData.parentPhone
      });
      setEditOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error updating student: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- DERIVED METRICS ---
  const totalClasses = unifiedAttendance.length;
  const presentClasses = unifiedAttendance.filter(r => r.status === 'present').length;
  const absentClasses = unifiedAttendance.filter(r => r.status === 'absent').length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
  
  const currentStreak = useMemo(() => {
    let streak = 0;
    const sorted = [...unifiedAttendance].sort((a, b) => b.date.localeCompare(a.date)); // descending
    const today = format(new Date(), 'yyyy-MM-dd');
    for (let record of sorted) {
      if (record.date <= today) {
        if (record.status === 'present') streak++;
        else if (record.status === 'absent') break;
      }
    }
    return streak;
  }, [unifiedAttendance]);

  // --- FILTERS ---
  const filteredAttendance = useMemo(() => {
    return unifiedAttendance.filter(record => {
      // Status Filter
      if (statusFilter !== 'All' && record.status !== statusFilter.toLowerCase()) return false;
      
      // Date Filter
      if (dateFilter !== 'All') {
        const recordDate = parseISO(record.date);
        if (dateFilter === 'Today' && !isToday(recordDate)) return false;
        if (dateFilter === 'This Week' && !isThisWeek(recordDate)) return false;
        if (dateFilter === 'This Month' && !isThisMonth(recordDate)) return false;
      }

      // Search Filter
      if (attendanceSearch) {
        const searchLower = attendanceSearch.toLowerCase();
        const matchDate = record.date.includes(searchLower);
        const matchTeacher = record.markedBy.toLowerCase().includes(searchLower);
        const matchStatus = record.status.toLowerCase().includes(searchLower);
        if (!matchDate && !matchTeacher && !matchStatus) return false;
      }
      return true;
    });
  }, [unifiedAttendance, statusFilter, dateFilter, attendanceSearch]);

  const renderCalendar = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const byDate = new Map(unifiedAttendance.map(record => [record.date, record]));
    return <div className="sd-calendar">
      <div className="sd-month">
        <IconButton aria-label="Previous month" onClick={() => setCurrentMonth(month => subMonths(month, 1))}><PrevIcon /></IconButton>
        <strong><CalendarIcon /> {format(currentMonth, 'MMMM yyyy')}</strong>
        <IconButton aria-label="Next month" onClick={() => setCurrentMonth(month => addMonths(month, 1))}><NextIcon /></IconButton>
      </div>
      <div className="sd-days">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => <small key={day}>{day}</small>)}
        {eachDayOfInterval({ start, end }).map(day => {
          const date = format(day, 'yyyy-MM-dd');
          const record = byDate.get(date);
          return <button type="button" key={date} disabled={!record} onClick={() => setSelectedRecord(record)}
            aria-label={[date, record?.status].filter(Boolean).join(', ')}
            className={[record?.status, !isSameMonth(day, currentMonth) && 'outside'].filter(Boolean).join(' ')}>
            {format(day, 'd')}
          </button>;
        })}
      </div>
    </div>;
  };

  const renderSearchBar = () => (
    <Paper sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <PersonIcon sx={{ fontSize: 60, color: '#4facfe', mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight="bold">Find Student</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
            Enter a Student ID to view their full profile and history.
        </Typography>
        <form onSubmit={handleSearch}>
            <TextField 
                fullWidth 
                label="Enter Student ID" 
                variant="outlined"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={handleSearch} edge="end">
                                <SearchIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
            <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                sx={{ mt: 2, bgcolor: '#4facfe', height: 50 }}
            >
                Search Profile
            </Button>
        </form>
    </Paper>
  );

  // --- MAIN RENDER ---

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) return <Box sx={{ p: 2 }}>{renderPageHeader(isParentView ? 'My Child' : 'Student Details')}<Alert severity="error">{loadError}</Alert></Box>;

  if (!studentId && isParentView) return <Box sx={{ p: 2 }}>{renderPageHeader('My Child')}<Alert severity="info">No child is linked to this parent account. Please contact the school administrator.</Alert></Box>;

  if (!studentId) {
      return (
        <Box sx={{ p: 2 }}>
            {renderPageHeader('Student Details')}
            {renderSearchBar()}
        </Box>
      );
  }

  if (studentId && !student) {
    return (
      <Box sx={{ p: 2 }}>
        {renderPageHeader(isParentView ? 'My Child' : 'Student Details', !isParentView && (
          <Button size="small" startIcon={<SearchIcon />} onClick={() => setSearchParams({})}>
            Search
          </Button>
        ))}
        <Alert severity="error">Student with ID "{studentId}" not found.</Alert>
      </Box>
    );
  }

  const title = isParentView
    ? (parent?.parentLang === 'te' ? 'నా పిల్లవాడి వివరాలు' : 'My Child Details') : 'Student Details';
  const fields = [
    [PersonIcon, 'Name', student.name], [IdIcon, 'ID', student.studentId],
    [SchoolIcon, 'Class', student.classType], [LocationIcon, 'Location', student.location || student.place],
    [FamilyIcon, 'Father', student.fatherName], [FamilyIcon, 'Mother', student.motherName],
    [PhoneIcon, 'Parent Phone', resolvedPhone]
  ];
  const phone = resolvedPhone.replace(/[^\d+]/g, '');
  return (
    <div className="sd-page">
      <header className="sd-header">
        <Button onClick={handleBack} startIcon={<BackIcon />}>Back</Button><h1>{title}</h1>
        {!isParentView && <IconButton aria-label="Find another student" onClick={() => setSearchParams({})}><SearchIcon /></IconButton>}
      </header>
      <section className="sd-identity sd-blue">
        <span>{student.name?.trim().charAt(0)}</span><div><h2>{student.name}</h2>
        <p>{[student.classType, student.location || student.place, student.studentId].filter(Boolean).join(' · ')}</p></div><SchoolIcon />
      </section>
      <section className="sd-card"><div className="sd-title"><PersonIcon /><h2>Personal Information</h2>
        {isAdmin && <IconButton aria-label="Edit student details" onClick={handleEditClick}><EditIcon /></IconButton>}</div>
        <div className="sd-fields">{fields.map(([Icon, label, value]) => <div key={label}><Icon /><div><small>{label}</small><b>{value || '—'}</b></div></div>)}
          <div><Button href={phone ? 'tel:' + phone : undefined} disabled={!phone} size="small" startIcon={<PhoneIcon />}>{isParentView ? 'Call Family Contact' : 'Call Parent'}</Button></div>
        </div>
      </section>
      <section className="sd-card" id="child-performance">
        <div className="sd-title"><TrendIcon /><h2>Performance Summary</h2></div>
        <div className="sd-stats">{[
          [DollarIcon,'Dollar Points', '$' + student.dollarPoints],
          [FlameIcon,'Current Streak', currentStreak],
          [AttendanceIcon,'Attendance', presentClasses + (presentClasses === 1 ? ' Day' : ' Days')]
        ].map(([Icon,label,value]) => <div key={label}><Icon /><div><small>{label}</small><b>{value}</b></div></div>)}</div>
      </section>
      <section className="sd-card" id="child-attendance">
        <div className="sd-title"><CalendarIcon /><h2>Attendance Summary</h2></div>
        <div className="sd-summary">
          <div className="sd-summary-items">
            <div><small>Total Classes</small><b>{totalClasses}</b></div>
            <div><small>Present</small><b>{presentClasses}</b></div>
            <div><small>Absent</small><b>{absentClasses}</b></div>
            <div><small>Attendance Rate</small><span className="sd-rate" style={{ '--rate': attendanceRate + '%' }}><b>{attendanceRate}%</b></span></div>
          </div>
        </div>
        {renderCalendar()}
        <div className="sd-filters">
          <TextField select size="small" label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {['All','Present','Absent'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>
          <TextField select size="small" label="Date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            {['All','Today','This Week','This Month'].map(v => <MenuItem key={v} value={v}>{v === 'All' ? 'All Time' : v}</MenuItem>)}</TextField>
          <TextField size="small" label="Search attendance" value={attendanceSearch} onChange={e => setAttendanceSearch(e.target.value)} />
        </div>
      </section>
      <section className="sd-card"><div className="sd-title"><AttendanceIcon /><h2>Attendance Records</h2></div>
        <div className="sd-scroll"><table><thead><tr>{['Date','Day','Status','Marked By','Marked At'].map(label => <th key={label}>{label}</th>)}</tr></thead>
          <tbody>{filteredAttendance.map(record => <tr key={record.date}>
            <td><button className="sd-date-link" onClick={() => setSelectedRecord(record)}>{record.date}</button></td>
            <td>{format(parseISO(record.date),'EEEE')}</td><td><span className={'sd-status ' + record.status}>{record.status}</span></td>
            <td>{record.markedBy}</td><td>{record.markedAt ? format(record.markedAt,'hh:mm a') : '—'}</td>
          </tr>)}</tbody></table></div>
        {!filteredAttendance.length && <p className="sd-empty">No attendance records found.</p>}
      </section>
      <section className="sd-card" id="child-dollars"><div className="sd-title"><GiftIcon /><h2>Reward History</h2></div>
        {rewards.map((reward, index) => {
          const amount = Number(reward.dollars);
          return <div className="sd-reward" key={index}><GiftIcon /><div>
            <small>{activityDate(reward.date)?.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) || '—'}</small>
            <b>{reward.reason || '—'}</b></div><strong className={amount < 0 ? 'deduction' : ''}>{Number.isFinite(amount) ? (amount < 0 ? '−' : '+') + '$' + Math.abs(amount) : '—'}</strong>
            <span>{reward.teacher || reward.awardedBy || '—'}</span></div>;
        })}
        {!rewards.length && <p className="sd-empty">No rewards recorded yet.</p>}
      </section>

      {/* Edit Dialog for Admins */}
      <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Student Details</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Full Name" 
                fullWidth 
                value={editData.name || ''} 
                onChange={(e) => setEditData({...editData, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Student ID" 
                fullWidth 
                value={editData.studentId || ''} 
                onChange={(e) => setEditData({...editData, studentId: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Class" 
                fullWidth 
                select
                value={editData.classType || ''} 
                onChange={(e) => setEditData({...editData, classType: e.target.value})}
              >
                {['Beginner', 'Primary', 'Secondary'].map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Location" 
                fullWidth 
                select
                value={editData.location || ''} 
                onChange={(e) => setEditData({...editData, location: e.target.value})}
              >
                {['Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'].map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Father's Name" 
                fullWidth 
                value={editData.fatherName || ''} 
                onChange={(e) => setEditData({...editData, fatherName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Mother's Name" 
                fullWidth 
                value={editData.motherName || ''} 
                onChange={(e) => setEditData({...editData, motherName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Parent Phone Number" 
                fullWidth 
                type="tel"
                value={editData.parentPhone || ''} 
                onChange={(e) => setEditData({...editData, parentPhone: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attendance Details Modal */}
      <Dialog open={!!selectedRecord} onClose={() => setSelectedRecord(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttendanceIcon color="primary" /> Attendance Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box>
              <Typography variant="body1"><strong>Student:</strong> {student?.name}</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}><strong>Student ID:</strong> {student?.studentId}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1"><strong>Date:</strong> {format(parseISO(selectedRecord.date), 'MMMM d, yyyy')}</Typography>
              <Typography variant="body1"><strong>Day:</strong> {format(parseISO(selectedRecord.date), 'EEEE')}</Typography>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                <strong>Status:</strong> 
                <Chip 
                    icon={selectedRecord.status === 'present' ? <PresentIcon /> : <AbsentIcon />}
                    label={selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                    color={selectedRecord.status === 'present' ? 'success' : 'error'}
                    size="small"
                />
              </Typography>
              <Typography variant="body1"><strong>Marked By:</strong> {selectedRecord.markedBy}</Typography>
              <Typography variant="body1"><strong>Marked At:</strong> {selectedRecord.markedAt ? format(selectedRecord.markedAt, 'hh:mm a') : '—'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRecord(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StudentDetailsPage;
