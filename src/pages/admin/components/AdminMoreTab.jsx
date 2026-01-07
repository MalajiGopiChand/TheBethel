import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import ActionGrid from '../../../components/ActionGrid';
import {
  Settings as SettingsIcon,
  CloudDownload as DownloadIcon
} from '@mui/icons-material';

const AdminMoreTab = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'App Settings',
      subtitle: 'Config',
      icon: <SettingsIcon />,
      colorStart: '#CFD9DF',
      colorEnd: '#E2EBF0',
      isEnabled: true,
      onClick: () => navigate('/admin/settings')
    },
    {
      title: 'Downloads',
      subtitle: 'Export PDF',
      icon: <DownloadIcon />,
      colorStart: '#80CBC4',
      colorEnd: '#B2DFDB',
      isEnabled: true,
      onClick: () => navigate('/teacher/download-records')
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        More Options
      </Typography>
      <ActionGrid actions={actions} />
    </Box>
  );
};

export default AdminMoreTab;

