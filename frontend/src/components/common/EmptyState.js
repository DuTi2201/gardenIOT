import React from 'react';
import { Box, Typography, Button, Paper, useTheme, alpha } from '@mui/material';
import AnimatedMascot from './AnimatedMascot';

// Component hiển thị khi không có dữ liệu
const EmptyState = ({
  title = 'Không có dữ liệu',
  message = 'Hiện chưa có dữ liệu nào để hiển thị',
  actionText = 'Tạo mới',
  onAction = null,
  mascotSize = 'medium',
  minHeight = '300px',
  useVideo = true,
  withPaper = true,
  withButton = true,
  icon = null
}) => {
  const theme = useTheme();

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: minHeight,
        padding: 3,
        gap: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at top right, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
          zIndex: 0,
        },
      }}
    >
      <AnimatedMascot 
        size={mascotSize}
        useVideo={useVideo}
        withShadow={true}
      />
      
      {icon && (
        <Box sx={{ mt: -3, mb: -1, zIndex: 1 }}>
          {icon}
        </Box>
      )}
      
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 'bold', 
          color: theme.palette.primary.main,
          textAlign: 'center',
          mt: 2,
          position: 'relative',
          zIndex: 1
        }}
      >
        {title}
      </Typography>
      
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
          maxWidth: '500px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          mb: 1
        }}
      >
        {message}
      </Typography>
      
      {withButton && onAction && (
        <Button
          variant="contained"
          color="primary"
          onClick={onAction}
          sx={{ 
            mt: 2,
            px: 3,
            py: 1,
            position: 'relative',
            zIndex: 1,
            borderRadius: 3,
            boxShadow: '0 8px 20px rgba(76, 175, 80, 0.2)',
            transition: 'all 0.3s ease',
            fontSize: '1rem',
            fontWeight: 'bold',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 12px 25px rgba(76, 175, 80, 0.3)'
            }
          }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );

  if (withPaper) {
    return (
      <Paper
        elevation={2}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {content}
      </Paper>
    );
  }

  return content;
};

export default EmptyState; 