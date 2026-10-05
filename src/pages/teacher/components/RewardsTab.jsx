import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import ActionGrid from '../../../components/ActionGrid';
import {
  AttachMoney as GiveDollarsIcon,
  History as HistoryIcon,
  EmojiEvents as LeaderboardIcon,
  AccountBalanceWallet as OfferingsIcon,
} from '@mui/icons-material';

const RewardsTab = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Student Leaderboard',
      subtitle: 'Rankings & Dollars',
      icon: <LeaderboardIcon />,
      colorStart: '#FFE53B',
      colorEnd: '#FF8E53',
      isEnabled: true,
      onClick: () => navigate('/teacher/leaderboard')
    },
    {
      title: 'Give Dollars',
      icon: <GiveDollarsIcon />,
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
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Rewards Management
      </Typography>
      <ActionGrid actions={actions} />
    </Box>
  );
};

export default RewardsTab;

