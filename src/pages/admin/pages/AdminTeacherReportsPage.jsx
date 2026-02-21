import React from 'react';
import { Box, Container, Typography, Paper, Tabs, Tab } from '@mui/material';
import TeacherLeaderboardPage from '../../teacher/pages/TeacherLeaderboardPage';

const AdminTeacherReportsPage = () => {
  const [tab, setTab] = React.useState(0);

  return (
    <Box sx={{ py: 3 }}>
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Typography variant="h5" fontWeight={800}>
            Teacher Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View teacher performance, points, and leaderboard rankings across the system.
          </Typography>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{ mt: 1 }}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Leaderboard" />
          </Tabs>
        </Paper>

        {/* Leaderboard reused from teacher portal */}
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ p: 2 }}>
            <TeacherLeaderboardPage />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminTeacherReportsPage;

