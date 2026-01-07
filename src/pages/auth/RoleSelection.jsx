import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  useTheme,
  Fade,
  Grow
} from '@mui/material';
import {
  SchoolRounded as SchoolIcon,
  FamilyRestroomRounded as FamilyIcon,
  AdminPanelSettingsRounded as AdminIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';

// --- Configuration Data ---
const roles = [
  {
    id: 'teacher',
    title: 'Teacher',
    description: 'Manage attendance, grade homework, and track student progress.',
    icon: <SchoolIcon fontSize="large" />,
    path: '/auth/teacher/login',
    color: '#2196F3', // Blue
    gradient: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
    delay: 500
  },
  {
    id: 'parent',
    title: 'Parent',
    description: 'View your child\'s performance, attendance records, and updates.',
    icon: <FamilyIcon fontSize="large" />,
    path: '/auth/parent/login',
    color: '#9C27B0', // Purple
    gradient: 'linear-gradient(135deg, #9C27B0 0%, #D05CE3 100%)',
    delay: 700
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Full system access to manage staff, students, and finances.',
    icon: <AdminIcon fontSize="large" />,
    path: '/auth/admin/login',
    color: '#FF9800', // Orange
    gradient: 'linear-gradient(135deg, #FF9800 0%, #FFD200 100%)',
    delay: 900
  }
];

const RoleSelection = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, #e3f2fd 100%)`, // Subtle background
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        
        {/* Header Section */}
        <Fade in={true} timeout={800}>
          <Box textAlign="center" mb={6}>
            <Box 
              sx={{ 
                display: 'inline-flex', 
                p: 1.5, 
                borderRadius: '50%', 
                bgcolor: 'primary.light', 
                color: 'primary.main',
                mb: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              <SchoolIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography 
              variant="h3" 
              component="h1" 
              fontWeight="900" 
              gutterBottom
              sx={{ 
                background: `-webkit-linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1px'
              }}
            >
              The Bethel Church
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight="normal">
              School Management Portal
            </Typography>
          </Box>
        </Fade>

        {/* Roles Grid */}
        <Grid container spacing={4} justifyContent="center">
          {roles.map((role) => (
            <Grid item xs={12} sm={6} md={4} key={role.id}>
              <Grow in={true} timeout={role.delay}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 4,
                    transition: 'all 0.3s ease-in-out',
                    border: '1px solid rgba(0,0,0,0.05)',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                      borderColor: role.color
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 4 }}>
                    {/* Icon with Gradient Background */}
                    <Avatar
                      sx={{
                        width: 90,
                        height: 90,
                        mx: 'auto',
                        mb: 3,
                        background: role.gradient,
                        boxShadow: `0 8px 20px ${role.color}40` // Colored shadow
                      }}
                    >
                      {role.icon}
                    </Avatar>

                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {role.title}
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {role.description}
                    </Typography>
                  </CardContent>

                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      endIcon={<ArrowIcon />}
                      onClick={() => navigate(role.path)}
                      sx={{
                        borderRadius: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: role.color,
                        borderColor: `${role.color}50`,
                        '&:hover': {
                          bgcolor: role.color,
                          color: '#fff',
                          borderColor: role.color
                        }
                      }}
                    >
                      Login as {role.title}
                    </Button>
                  </Box>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>

        {/* Footer */}
        <Box mt={8} textAlign="center">
          <Typography variant="caption" color="text.disabled">
            © {new Date().getFullYear()} The Bethel Church. All rights reserved.
          </Typography>
        </Box>

      </Container>
    </Box>
  );
};

export default RoleSelection;