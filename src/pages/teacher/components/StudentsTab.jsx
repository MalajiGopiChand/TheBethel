import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import ActionGrid from '../../../components/ActionGrid';
import {
  Person as StudentIcon,
  PersonOff as AbsentIcon,
  CloudDownload as DownloadIcon,
  Badge as ProfileIcon // Icon for the new button
} from '@mui/icons-material';

const StudentsTab = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Manage Students',
      description: 'Add, Edit, View List',
      icon: <StudentIcon />,
      colorStart: '#a18cd1',
      colorEnd: '#fbc2eb',
      isEnabled: true,
      onClick: () => navigate('/teacher/students-manage')
    },
    {
      title: 'Student Profile',
      description: 'Search & View Details',
      icon: <ProfileIcon />,
      colorStart: '#4facfe', // Blue gradient
      colorEnd: '#00f2fe',
      isEnabled: true,
      onClick: () => navigate('/teacher/student-details') // Link to your new page
    },
    {
      title: 'Absent Records',
      description: 'View & Filter Absences',
      icon: <AbsentIcon />,
      colorStart: '#ff9a9e',
      colorEnd: '#fecfef',
      isEnabled: true,
      onClick: () => navigate('/teacher/students-absent')
    },
    {
      title: 'Download Data',
      description: 'Export Student Reports',
      icon: <DownloadIcon />,
      colorStart: '#84fab0',
      colorEnd: '#8fd3f4',
      isEnabled: true,
      onClick: () => navigate('/teacher/students-download')
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Student Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage enrollment, track individual performance, or export data.
      </Typography>
      
      <ActionGrid actions={actions} />
    </Box>
  );
};

export default StudentsTab;