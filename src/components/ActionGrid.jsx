import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  alpha
} from '@mui/material';

const ActionGrid = ({ actions }) => {
  return (
    <Box sx={{ px: 2, py: 1 }}>
      {actions.reduce((rows, action, index) => {
        if (index % 2 === 0) {
          rows.push([action]);
        } else {
          rows[rows.length - 1].push(action);
        }
        return rows;
      }, []).map((row, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: 'flex',
            gap: 1.5,
            mb: 1.5,
            '&:last-child': { mb: 0 }
          }}
        >
          {row.map((item, itemIndex) => (
            <ActionTile key={itemIndex} item={item} />
          ))}
          {row.length === 1 && <Box sx={{ flex: 1 }} />}
        </Box>
      ))}
    </Box>
  );
};

const ActionTile = ({ item }) => {
  const enabled = item.isEnabled !== false;

  return (
    <Card
      onClick={enabled ? item.onClick : undefined}
      sx={{
        flex: 1,
        height: 110,
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
      <CardContent
        sx={{
          height: '100%',
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
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: enabled ? alpha('#000', 0.8) : alpha('#000', 0.4),
            fontSize: '0.875rem',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {item.title}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ActionGrid;

