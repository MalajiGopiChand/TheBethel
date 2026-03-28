import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip
} from '@mui/material';
import {
  Campaign as AnnouncementIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';

const AnnouncementsSection = ({ announcements }) => {
  if (!announcements || announcements.length === 0) {
    return null;
  }

  return (
    <Box>
      {announcements.map((announcement, index) => (
        <Card 
          key={index}
          elevation={1}
          sx={{ 
            mb: 1.5, 
            borderLeft: announcement.isImportant ? '5px solid #d32f2f' : '5px solid #1976d2', 
            bgcolor: announcement.isImportant ? '#fff5f5' : '#f0f7ff', 
            borderRadius: 2 
          }}
        >
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, pr: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: announcement.isImportant ? '#d32f2f' : '#1976d2' }}>
                    {announcement.title}
                  </Typography>
                  {announcement.isImportant && (
                    <Chip size="small" icon={<PriorityHighIcon sx={{ fontSize: '14px !important' }}/>} label="Urgent" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                  {announcement.message}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.5)', fontWeight: 'bold' }}>
                    {announcement.sender || 'Admin'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.3)' }}>•</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.5)' }}>
                    {announcement.audience}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ textAlign: 'right', borderLeft: '1px solid rgba(0,0,0,0.1)', pl: 2, minWidth: '70px' }}>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block' }}>
                  {announcement.date || 'Recent'}
                </Typography>
                <AnnouncementIcon sx={{ fontSize: 20, color: announcement.isImportant ? 'rgba(211,47,47,0.5)' : 'rgba(25,118,210,0.5)', mt: 1 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default AnnouncementsSection;

