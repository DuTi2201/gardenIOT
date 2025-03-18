import React from 'react';
import { Box, Typography, CircularProgress, keyframes, useTheme } from '@mui/material';
import AnimatedMascot from './AnimatedMascot';

// Hiệu ứng nhảy lên xuống
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
`;

// Hiệu ứng xoay tròn
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Hiệu ứng mờ dần
const pulse = keyframes`
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
`;

const LoadingState = ({
  message = 'Đang tải dữ liệu...',
  variant = 'mascot', // 'mascot', 'spinner', 'overlay'
  size = 'medium',
  fullPage = false,
  withOverlay = false,
  useVideo = true
}) => {
  const theme = useTheme();

  // Hiển thị loading toàn trang
  if (fullPage) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: withOverlay ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
          backdropFilter: withOverlay ? 'blur(5px)' : 'none',
          zIndex: 9999,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${pulse} 2s infinite ease-in-out`,
          }}
        >
          {variant === 'mascot' ? (
            <AnimatedMascot
              size={size}
              useVideo={useVideo}
              style={{
                animation: `${bounce} 2s infinite`,
              }}
            />
          ) : (
            <CircularProgress
              size={size === 'small' ? 40 : size === 'large' ? 80 : 60}
              thickness={4}
              sx={{
                color: theme.palette.primary.main,
                mb: 2,
              }}
            />
          )}

          <Typography
            variant="h6"
            sx={{
              color: theme.palette.primary.main,
              mt: 3,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {message}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Hiển thị loading trong component
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        minHeight: '200px',
        position: 'relative',
      }}
    >
      {variant === 'mascot' ? (
        <AnimatedMascot
          size={size}
          useVideo={useVideo}
          style={{
            animation: `${bounce} 2s infinite`,
          }}
        />
      ) : (
        <CircularProgress
          size={size === 'small' ? 40 : size === 'large' ? 80 : 60}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
            mb: 2,
          }}
        />
      )}

      <Typography
        variant="body1"
        sx={{
          color: theme.palette.text.secondary,
          mt: 3,
          fontWeight: 500,
          textAlign: 'center',
          animation: `${pulse} 2s infinite ease-in-out`,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingState; 