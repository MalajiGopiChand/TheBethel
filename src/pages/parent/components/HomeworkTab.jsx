import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Fade,
  Grow,
  Stack,
  Divider,
  Avatar,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { 
  Assignment as AssignmentIcon,
  Subject as SubjectIcon,
  Place as PlaceIcon,
  CalendarToday as DateIcon,
  School as SchoolIcon,
  CheckCircle as DoneIcon,
  Warning as OverdueIcon
} from '@mui/icons-material';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { db } from '../../../config/firebase';

const HomeworkTab = ({ student }) => {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  // Helper to format date nicely (Today, Tomorrow, or Date)
  const formatDueDate = (dateObj) => {
    if (!dateObj) return 'No Due Date';
    if (isToday(dateObj)) return 'Today';
    if (isTomorrow(dateObj)) return 'Tomorrow';
    return format(dateObj, 'MMM dd, yyyy');
  };

  useEffect(() => {
    if (!student) {
      setHomeworks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const homeworksQuery = query(
      collection(db, 'homeworks'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(homeworksQuery, (snapshot) => {
      let homeworksData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });

      if (student?.studentId) {
        homeworksData = homeworksData.filter(hw => {
          // 1. Check if specifically assigned to this student
          const studentRollNumbers = hw.studentRollNumbers || hw.studentIds || [];
          const isAssignedToStudent = Array.isArray(studentRollNumbers) && 
            studentRollNumbers.length > 0 && 
            studentRollNumbers.includes(student.studentId);
          
          if (isAssignedToStudent) {
            // Check if expired (don't show expired homework)
            if (hw.dueDate) {
              let dueDateObj = null;
              if (typeof hw.dueDate.toDate === 'function') {
                dueDateObj = hw.dueDate.toDate();
              } else if (hw.dueDate instanceof Date) {
                dueDateObj = hw.dueDate;
              }
              if (dueDateObj) {
                const now = new Date();
                const oneDayAfter = new Date(dueDateObj);
                oneDayAfter.setDate(oneDayAfter.getDate() + 1);
                // Don't show if more than 1 day past due date
                if (now > oneDayAfter) return false;
              }
            }
            return true;
          }

          // 2. Check general assignments (no specific student assignment)
          const isGeneralAssignment = !hw.studentRollNumbers && 
            (!hw.studentIds || hw.studentIds.length === 0);

          if (isGeneralAssignment) {
            // Match by class and place
            const studentClass = student.classType || student.class || student.className;
            const studentPlace = student.location || student.place || student.branch;
            
            // If homework has no class/place specified, show it to everyone
            if (!hw.classType && !hw.place) {
              // Check if expired
              if (hw.dueDate) {
                let dueDateObj = null;
                if (typeof hw.dueDate.toDate === 'function') {
                  dueDateObj = hw.dueDate.toDate();
                } else if (hw.dueDate instanceof Date) {
                  dueDateObj = hw.dueDate;
                }
                if (dueDateObj) {
                  const now = new Date();
                  const oneDayAfter = new Date(dueDateObj);
                  oneDayAfter.setDate(oneDayAfter.getDate() + 1);
                  if (now > oneDayAfter) return false;
                }
              }
              return true;
            }
            
            // Match class (if specified in homework)
            const matchesClass = !hw.classType || hw.classType === studentClass;
            
            // Match place (if specified in homework)
            const matchesPlace = !hw.place || hw.place === studentPlace;
            
            // Show if both match, or if neither is specified
            if (matchesClass && matchesPlace) {
              // Check if expired
              if (hw.dueDate) {
                let dueDateObj = null;
                if (typeof hw.dueDate.toDate === 'function') {
                  dueDateObj = hw.dueDate.toDate();
                } else if (hw.dueDate instanceof Date) {
                  dueDateObj = hw.dueDate;
                }
                if (dueDateObj) {
                  const now = new Date();
                  const oneDayAfter = new Date(dueDateObj);
                  oneDayAfter.setDate(oneDayAfter.getDate() + 1);
                  // Don't show if more than 1 day past due date
                  if (now > oneDayAfter) return false;
                }
              }
              return true;
            }
          }
          
          return false;
        });
      } else {
        // If no studentId, show all homeworks (fallback)
        homeworksData = [];
      }

      setHomeworks(homeworksData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching homeworks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [student]);

  if (!student) {
    return (
      <Fade in={true}>
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 3 }}>
          Student profile not loaded.
        </Alert>
      </Fade>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Fade in={true} timeout={500}>
        <Box mb={3} display="flex" alignItems="center" gap={1}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <SchoolIcon />
            </Box>
            <Box>
                <Typography variant="h5" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
                    Homework
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {homeworks.length} assignments found
                </Typography>
            </Box>
        </Box>
      </Fade>

      {homeworks.length === 0 ? (
        <Fade in={true} timeout={800}>
            <Box textAlign="center" py={6} sx={{ opacity: 0.6 }}>
                <AssignmentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No homework assigned</Typography>
                <Typography variant="body2" color="text.secondary">Enjoy your free time!</Typography>
            </Box>
        </Fade>
      ) : (
        <Stack spacing={2}>
          {homeworks.map((homework, index) => {
            // Date Logic for Styling
            let dueDateObj = null;
            if (homework.dueDate) {
                if (typeof homework.dueDate.toDate === 'function') dueDateObj = homework.dueDate.toDate();
                else if (homework.dueDate instanceof Date) dueDateObj = homework.dueDate;
            }
            
            const isOverdue = dueDateObj && isPast(dueDateObj) && !isToday(dueDateObj);
            const isDueToday = dueDateObj && isToday(dueDateObj);

            return (
              <Grow in={true} key={homework.id} timeout={500 + (index * 100)}>
                <Card 
                  elevation={2}
                  sx={{ 
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'visible',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  {/* Status Indicator Bar */}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      left: 0, 
                      top: 15, 
                      bottom: 15, 
                      width: 4, 
                      borderRadius: '0 4px 4px 0',
                      bgcolor: isOverdue ? 'error.main' : isDueToday ? 'warning.main' : 'primary.main'
                    }} 
                  />

                  <CardContent sx={{ pl: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box>
                            {/* Subject & Title */}
                            <Chip 
                                icon={<SubjectIcon sx={{ fontSize: '14px !important' }} />}
                                label={homework.subject || 'General'} 
                                size="small" 
                                sx={{ 
                                    mb: 1, 
                                    height: 24, 
                                    fontSize: '0.7rem', 
                                    fontWeight: 'bold',
                                    bgcolor: isOverdue ? 'error.50' : 'primary.50',
                                    color: isOverdue ? 'error.main' : 'primary.main'
                                }} 
                            />
                            <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
                                {homework.title}
                            </Typography>
                        </Box>
                        
                        {/* Date Badge */}
                        {dueDateObj && (
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center',
                                    bgcolor: isOverdue ? 'error.50' : 'grey.50',
                                    p: 1,
                                    borderRadius: 3,
                                    minWidth: 60
                                }}
                            >
                                <Typography variant="caption" fontWeight="bold" color={isOverdue ? 'error.main' : 'text.secondary'} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                    DUE
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color={isOverdue ? 'error.main' : 'text.primary'}>
                                    {formatDueDate(dueDateObj)}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Description */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                        {homework.description}
                    </Typography>

                    <Divider sx={{ my: 1.5, opacity: 0.5 }} />

                    {/* Footer Meta Data */}
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" gap={2}>
                            <Box display="flex" alignItems="center" gap={0.5} sx={{ opacity: 0.7 }}>
                                <SchoolIcon sx={{ fontSize: 16 }} />
                                <Typography variant="caption" fontWeight="medium">{homework.classType || 'All Classes'}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={0.5} sx={{ opacity: 0.7 }}>
                                <PlaceIcon sx={{ fontSize: 16 }} />
                                <Typography variant="caption" fontWeight="medium">{homework.place || 'All Branches'}</Typography>
                            </Box>
                        </Box>
                        
                        {/* Overdue/Active Status Icon */}
                        {isOverdue ? (
                            <Tooltip title="Past Due">
                                <OverdueIcon color="error" fontSize="small" />
                            </Tooltip>
                        ) : (
                            <Tooltip title="Active Assignment">
                                <AssignmentIcon color="action" fontSize="small" sx={{ opacity: 0.3 }} />
                            </Tooltip>
                        )}
                    </Box>

                  </CardContent>
                </Card>
              </Grow>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default HomeworkTab;