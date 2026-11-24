import React from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Avatar,
  alpha
} from '@mui/material';

const ActionGrid = ({ actions }) => {
  return (
    <Box className="action-grid" sx={{ px: 2, py: 1, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
      {actions.map(item => <ActionTile key={item.title} item={item} />)}
    </Box>
  );
};

const ActionTile = ({ item }) => {
  const enabled = item.isEnabled !== false;

  return (
    <Card
      className="action-tile"
      style={{ '--tile-tint': alpha(item.colorEnd, 0.22) }}
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: 128,
        borderRadius: 2.5,
        cursor: enabled ? 'pointer' : 'default',
        boxShadow: enabled ? 4 : 0,
        background: enabled ? '#fff' : '#F9FAFB',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: 'fadeInUp 0.5s ease-out',
        '@keyframes fadeInUp': {
          from: {
            opacity: 0,
            transform: 'translateY(20px)'
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)'
          }
        },
        '&:hover': enabled ? {
          transform: 'translateY(-4px) scale(1.02)',
          boxShadow: 8
        } : {},
        '&:active': enabled ? {
          transform: 'translateY(-1px) scale(0.98)'
        } : {},
        backgroundImage: enabled
          ? `linear-gradient(135deg, ${alpha(item.colorStart, 0.2)} 0%, ${alpha(item.colorEnd, 0.2)} 100%)`
          : `linear-gradient(135deg, ${alpha(item.colorStart, 0.05)} 0%, ${alpha(item.colorEnd, 0.05)} 100%)`
      }}
    >
      <CardActionArea
        disabled={!enabled}
        onClick={item.onClick}
        aria-label={item.title}
        sx={{ height: '100%', '&.Mui-focusVisible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: -3 } }}
      >
      <CardContent
        sx={{
          minHeight: 128,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 2,
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Background Icon */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -10,
            right: -10,
            opacity: enabled ? 0.15 : 0.05,
            transform: 'rotate(-15deg)',
            zIndex: 0
          }}
        >
          {React.cloneElement(item.icon, {
            sx: { fontSize: 80, color: item.colorStart }
          })}
        </Box>

        {/* Icon Avatar */}
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: enabled ? '#fff' : '#F3F4F6',
            boxShadow: enabled ? 2 : 0,
            mb: 'auto'
          }}
        >
          <Box sx={{ color: enabled ? item.colorStart : alpha('#000', 0.3), fontSize: 18 }}>
            {React.cloneElement(item.icon, { fontSize: 'inherit' })}
          </Box>
        </Avatar>

        {/* Title */}
        <Box sx={{ minWidth: 0 }}><Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: enabled ? alpha('#000', 0.8) : alpha('#000', 0.4),
            fontSize: '0.875rem',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {item.title}
        </Typography>
        {item.subtitle && <Typography className="action-subtitle" sx={{ display: 'none', '.admin-experience &': { display: 'block' } }}>{item.subtitle}</Typography>}
        </Box>
      </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ActionGrid;

