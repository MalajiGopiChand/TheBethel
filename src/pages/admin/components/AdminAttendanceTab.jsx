import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import ActionGrid from '../../../components/ActionGrid';
import {
  EventNote as MarkAttendanceIcon,
  ListAlt as SummaryIcon,
  PersonAdd as AddStudentIcon,
  PersonOff as AbsentIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const AdminAttendanceTab = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Mark Attendance',
      icon: <MarkAttendanceIcon />,
      colorStart: '#8EC5FC',
      colorEnd: '#E0C3FC',
      isEnabled: true,
      onClick: () => navigate('/teacher/attendance')
    },
    {
      title: 'View Summary',
      icon: <SummaryIcon />,
      colorStart: '#A1C4FD',
      colorEnd: '#C2E9FB',
      isEnabled: true,
      onClick: () => navigate('/teacher/attendance-summary')
    },
    {
      title: 'Add Student',
      icon: <AddStudentIcon />,
      colorStart: '#D4FC79',
      colorEnd: '#96E6A1',
      isEnabled: true,
      onClick: () => navigate('/admin/add-student')
    },
    {
      title: 'Absent Students',
      icon: <AbsentIcon />,
      colorStart: '#F093FB',
      colorEnd: '#F5576C',
      isEnabled: true,
      onClick: () => navigate('/teacher/absent-students')
    },
    {
      title: 'Delete Student',
      icon: <DeleteIcon />,
      colorStart: '#FEE140',
      colorEnd: '#FA709A',
      isEnabled: true,
      onClick: () => navigate('/admin/delete-student')
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Attendance Management
      </Typography>
      <ActionGrid actions={actions} />
    </Box>
  );
};

export default AdminAttendanceTab;

