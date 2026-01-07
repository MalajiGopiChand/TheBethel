import React from 'react';
import { Card, Box, Typography, CircularProgress, alpha } from '@mui/material';

const AttendanceCard = ({ data, canEdit }) => {
  if (!data) {
    return null;
  }

  const totalStudents = data.totalStudents || 0;
  const todayPresentCount = data.todayPresentCount || 0;
  const todayAbsentCount = data.todayAbsentCount || 0;
  const attendancePercentage = data.attendancePercentage || 0;

  const progress = totalStudents > 0 
    ? todayPresentCount / totalStudents 
    : 0;

  const gradientColors = canEdit 
    ? ['#4A00E0', '#8E2DE2'] 
    : ['#6B7280', '#9CA3AF'];

  return (
    <Card
      sx={{
        width: '100%',
        height: 200,
        borderRadius: 3,
        boxShadow: 10,
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
        position: 'relative',
        mb: 2
      }}
    >
      {!canEdit && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: alpha('#000', 0.1),
            zIndex: 1
          }}
        />
      )}
      
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          position: 'relative',
          zIndex: 2
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: alpha('#fff', 0.8),
              mb: 1
            }}
          >
            Today's Attendance
          </Typography>
          <Typography
            variant="h3"
            sx={{
              color: '#fff',
              fontWeight: 'bold',
              mb: 0.5
            }}
          >
            {todayPresentCount} Present
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: alpha('#fff', 0.7)
            }}
          >
            {todayAbsentCount} Absent
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={90}
            thickness={8}
            sx={{
              position: 'absolute',
              color: alpha('#fff', 0.2),
            }}
          />
          <CircularProgress
            variant="determinate"
            value={progress * 100}
            size={90}
            thickness={8}
            sx={{
              color: canEdit ? '#00E676' : '#9CA3AF',
              position: 'relative',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: '#fff',
                fontWeight: 'bold'
              }}
            >
              {attendancePercentage}%
            </Typography>
            {!canEdit && (
              <Typography
                variant="caption"
                sx={{
                  color: alpha('#fff', 0.7),
                  fontSize: '0.65rem'
                }}
              >
                View Only
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default AttendanceCard;

