import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import ActionGrid from '../../../components/ActionGrid';
import {
  People as StudentsIcon,
  Person as StudentDetailsIcon,
  AttachMoney as DollarsIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  List as RecordsIcon
} from '@mui/icons-material';

const AdminManageTab = () => {
  const navigate = useNavigate();

  const actions = [
   
    {
      title: 'Student Details',
      icon: <StudentDetailsIcon />,
      colorStart: '#FF9A9E',
      colorEnd: '#FECFEF',
      isEnabled: true,
      onClick: () => navigate('/teacher/view-students')
    },
    {
      title: 'Give Dollars',
      icon: <DollarsIcon />,
      colorStart: '#FFECD2',
      colorEnd: '#FCB69F',
      isEnabled: true,
      onClick: () => navigate('/teacher/dollars-giving')
    },
    {
      title: 'View Dollar History',
      icon: <HistoryIcon />,
      colorStart: '#FFECD2',
      colorEnd: '#FCB69F',
      isEnabled: true,
      onClick: () => navigate('/teacher/dollar-history')
    },
    {
      title: 'Download Records',
      icon: <DownloadIcon />,
      colorStart: '#80CBC4',
      colorEnd: '#B2DFDB',
      isEnabled: true,
      onClick: () => navigate('/teacher/download-records')
    },
    {
      title: 'View Records',
      icon: <RecordsIcon />,
      colorStart: '#80CBC4',
      colorEnd: '#B2DFDB',
      isEnabled: true,
      onClick: () => navigate('/teacher/view-records')
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Student Management
      </Typography>
      <ActionGrid actions={actions} />
    </Box>
  );
};

export default AdminManageTab;

