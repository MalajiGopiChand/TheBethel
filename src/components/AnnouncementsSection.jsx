import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';

const AnnouncementsSection = ({ announcements }) => {
  const [expanded, setExpanded] = useState(false);

  if (announcements.length === 0) {
    return null;
  }

  return (
    <Card
      sx={{
        mb: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        cursor: 'pointer'
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon />
            <Typography variant="h6" fontWeight="bold">
              Announcements
            </Typography>
          </Box>
          <IconButton size="small" sx={{ color: '#fff' }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {!expanded && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Tap to view
            </Typography>
          </Box>
        )}

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {announcements.map((announcement, index) => (
              <Box key={index} sx={{ mb: index < announcements.length - 1 ? 2 : 0 }}>
                {index > 0 && <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.2)', pt: 2, mt: 2 }} />}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={announcement.audience}
                        size="small"
                        sx={{
                          bgcolor: announcement.audience === 'Teachers' 
                            ? 'rgba(255, 154, 158, 0.2)'
                            : 'rgba(132, 250, 176, 0.2)',
                          border: `1px solid ${announcement.audience === 'Teachers' ? 'rgba(255, 154, 158, 0.5)' : 'rgba(132, 250, 176, 0.5)'}`,
                          color: '#fff',
                          fontSize: '0.7rem'
                        }}
                      />
                      {announcement.isImportant && (
                        <PriorityHighIcon sx={{ fontSize: 16, color: '#ff4444' }} />
                      )}
                    </Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                      {announcement.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {announcement.message}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.7, whiteSpace: 'nowrap' }}>
                    {announcement.date}
                  </Typography>
                </Box>
              </Box>
            ))}
            <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'center', mt: 2 }}>
              Tap to collapse
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AnnouncementsSection;

