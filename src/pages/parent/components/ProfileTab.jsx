import React from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  useTheme,
  Grow,
  Fade,
  Zoom
} from '@mui/material';
import {
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Badge as IdIcon,
  FamilyRestroom as FamilyIcon,
  Person as PersonIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as StreakIcon,
  CalendarMonth as AttendanceIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';

const ProfileTab = ({ student, parentUser }) => {
  const theme = useTheme();

  if (!student) {
    return (
      <Fade in={true}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
          <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary">
            No student profile data found.
          </Typography>
        </Box>
      </Fade>
    );
  }

  // Calculations
  const attendanceList = student.attendance || [];
  const absentDates = student.absentDates || [];
  const totalDays = attendanceList.length + absentDates.length;
  const attendancePercentage = totalDays > 0
    ? Math.round((attendanceList.length / totalDays) * 100)
    : 0;

  // Helper to generate initials
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name[0].toUpperCase();
  };

  // Helper Component for Info Rows with Hover Effect
  const InfoItem = ({ icon, label, value, delay }) => (
    <Grow in={true} style={{ transformOrigin: '0 0 0' }} timeout={delay}>
      <ListItem 
        disablePadding 
        sx={{ 
          py: 1.5,
          px: 1,
          borderRadius: 2,
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: 'action.hover',
            transform: 'translateX(5px)'
          }
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: theme.palette.primary.main }}>
          {icon}
        </ListItemIcon>
        <ListItemText 
          primary={<Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 'bold', fontSize: '0.7rem' }}>{label}</Typography>}
          secondary={<Typography variant="body1" fontWeight="500" color="text.primary">{value || 'N/A'}</Typography>}
        />
      </ListItem>
    </Grow>
  );

  return (
    <Box sx={{ pb: 4 }}>
      
      {/* 1. Profile Header Card */}
      <Grow in={true} timeout={800}>
        <Card 
          elevation={4}
          sx={{ 
            borderRadius: 4, 
            overflow: 'visible', 
            mb: 4,
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 12
            }
          }} 
        >
          {/* Animated Gradient Banner */}
          <Box 
            sx={{ 
              height: 140, 
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundSize: '200% 200%',
              animation: 'gradientBG 6s ease infinite',
              position: 'relative',
              borderRadius: '16px 16px 0 0',
              '@keyframes gradientBG': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' },
              }
            }}
          />
          
          <Box sx={{ px: 3, pb: 3, mt: -7, textAlign: 'center' }}>
            {/* Avatar with Zoom entrance */}
            <Zoom in={true} timeout={1000}>
              <Avatar 
                sx={{ 
                  width: 110, 
                  height: 110, 
                  border: '5px solid #fff', 
                  bgcolor: theme.palette.secondary.main,
                  fontSize: '2.2rem',
                  fontWeight: '900',
                  mx: 'auto',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05) rotate(5deg)'
                  }
                }}
              >
                {getInitials(student.name)}
              </Avatar>
            </Zoom>
            
            <Typography variant="h5" fontWeight="800" sx={{ mt: 2 }}>
              {student.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
              Student ID: {student.studentId}
            </Typography>
          </Box>

          <Divider sx={{ mx: 2, opacity: 0.6 }} />

          {/* Quick Stats Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-around', py: 2.5, bgcolor: 'rgba(0,0,0,0.02)' }}>
              {/* Points */}
              <Box 
                textAlign="center" 
                sx={{ 
                  transition: 'transform 0.2s', 
                  '&:hover': { transform: 'scale(1.1)' },
                  cursor: 'default'
                }}
              >
                  <Typography variant="h6" fontWeight="900" color="warning.main" sx={{ lineHeight: 1 }}>
                      ${student.dollarPoints || 0}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mt={0.5}>
                      <TrophyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">Points</Typography>
                  </Box>
              </Box>
              
              <Divider orientation="vertical" flexItem />
              
              {/* Streak */}
              <Box 
                textAlign="center"
                sx={{ 
                  transition: 'transform 0.2s', 
                  '&:hover': { transform: 'scale(1.1)' },
                  cursor: 'default'
                }}
              >
                  <Typography variant="h6" fontWeight="900" color="error.main" sx={{ lineHeight: 1 }}>
                      {student.currentStreak || 0}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mt={0.5}>
                      <StreakIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">Streak</Typography>
                  </Box>
              </Box>
              
              <Divider orientation="vertical" flexItem />
              
              {/* Attendance */}
              <Box 
                textAlign="center"
                sx={{ 
                  transition: 'transform 0.2s', 
                  '&:hover': { transform: 'scale(1.1)' },
                  cursor: 'default'
                }}
              >
                  <Typography variant="h6" fontWeight="900" color="success.main" sx={{ lineHeight: 1 }}>
                      {attendancePercentage}%
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mt={0.5}>
                      <AttendanceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">Attnd.</Typography>
                  </Box>
              </Box>
          </Box>
        </Card>
      </Grow>

      {/* 2. Detailed Info Sections */}
      <Grid container spacing={3}>
        
        {/* Academic Details (Slide in slightly delayed) */}
        <Grid item xs={12} md={6}>
            <Grow in={true} timeout={1200}>
              <Paper 
                elevation={2} 
                sx={{ 
                  borderRadius: 4, 
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                  <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.50', borderRadius: '16px 16px 0 0' }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'primary.main' }}>
                          <SchoolIcon /> Academic Details
                      </Typography>
                  </Box>
                  <List sx={{ px: 2, py: 1 }}>
                      <InfoItem icon={<SchoolIcon />} label="Class / Grade" value={student.classType} delay={1300} />
                      <Divider variant="inset" component="li" />
                      <InfoItem icon={<LocationIcon />} label="Branch / Location" value={student.location} delay={1400} />
                      <Divider variant="inset" component="li" />
                      <InfoItem icon={<IdIcon />} label="Roll Number / ID" value={student.studentId} delay={1500} />
                  </List>
              </Paper>
            </Grow>
        </Grid>

        {/* Family Details (Slide in more delayed) */}
        <Grid item xs={12} md={6}>
            <Grow in={true} timeout={1500}>
              <Paper 
                elevation={2} 
                sx={{ 
                  borderRadius: 4, 
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                  <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.50', borderRadius: '16px 16px 0 0' }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'primary.main' }}>
                          <FamilyIcon /> Family Information
                      </Typography>
                  </Box>
                  <List sx={{ px: 2, py: 1 }}>
                      <InfoItem icon={<PersonIcon />} label="Father's Name" value={student.fatherName} delay={1600} />
                      <Divider variant="inset" component="li" />
                      <InfoItem icon={<PersonIcon />} label="Mother's Name" value={student.motherName} delay={1700} />
                      
                      {parentUser && (
                          <>
                              <Divider variant="inset" component="li" />
                              <InfoItem icon={<EmailIcon />} label="Registered Email" value={parentUser.email} delay={1800} />
                              {parentUser.phone && (
                                  <>
                                      <Divider variant="inset" component="li" />
                                      <InfoItem icon={<PhoneIcon />} label="Contact Phone" value={parentUser.phone} delay={1900} />
                                  </>
                              )}
                          </>
                      )}
                  </List>
              </Paper>
            </Grow>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfileTab;