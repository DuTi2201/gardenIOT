import React, { useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper, Grid, useTheme, useMediaQuery } from '@mui/material';
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import AnimatedMascot from '../components/common/AnimatedMascot';

// Component con cho phần nội dung
const NotFoundContent = React.memo(({ isMobile, handleGoBack }) => {
  return (
    <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
      <Typography 
        variant="h1" 
        component="h1" 
        sx={{ 
          fontSize: { xs: '3rem', sm: '4rem', md: '5rem' }, 
          fontWeight: 'bold', 
          background: 'linear-gradient(90deg, #2E7D32, #4CAF50)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2
        }}
      >
        404
      </Typography>
      
      <Typography 
        variant="h4" 
        component="h2" 
        sx={{ 
          mb: 2,
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}
      >
        Ồ, không tìm thấy trang!
      </Typography>
      
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
          mb: 4,
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}
      >
        Có vẻ như bạn đang tìm kiếm một trang không tồn tại hoặc đã bị di chuyển.
        <br />
        Đừng lo lắng, linh vật Garden IoT sẽ giúp bạn quay lại đúng hướng!
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        flexWrap: 'wrap',
        justifyContent: { xs: 'center', md: 'flex-start' }
      }}>
        <Button 
          variant="contained" 
          startIcon={<HomeIcon />}
          component={RouterLink}
          to="/dashboard"
          size={isMobile ? "medium" : "large"}
          sx={{ borderRadius: '30px', px: 3 }}
        >
          Trang chủ
        </Button>
        
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          size={isMobile ? "medium" : "large"}
          sx={{ borderRadius: '30px', px: 3 }}
        >
          Quay lại
        </Button>
      </Box>
    </Grid>
  );
});

NotFoundContent.displayName = 'NotFoundContent';

// Component con cho phần mascot
const MascotSection = React.memo(({ isMobile }) => {
  return (
    <Grid item xs={12} md={6} sx={{ 
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative'
    }}>
      <Box sx={{ 
        position: 'relative', 
        width: { xs: '70%', sm: '60%', md: '80%' }, 
        maxWidth: 300,
        mt: { xs: 3, md: 0 }
      }}>
        <AnimatedMascot 
          animation="bounce" 
          size={isMobile ? "medium" : "large"} 
          withBackground={true}
          backgroundOpacity={0.05}
        />
        
        <Typography
          variant="body2"
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            bgcolor: 'primary.main',
            color: 'white',
            py: 0.5,
            px: 2,
            borderRadius: 10,
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap'
          }}
        >
          Để tôi giúp bạn!
        </Typography>
      </Box>
    </Grid>
  );
});

MascotSection.displayName = 'MascotSection';

const NotFound = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Sử dụng useCallback để tối ưu hóa hàm xử lý sự kiện
  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <Container maxWidth="md" sx={{ 
      py: { xs: 4, md: 8 },
      minHeight: 'calc(100vh - 64px)', 
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Paper sx={{ 
        p: { xs: 3, sm: 5 }, 
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        width: '100%'
      }}>
        <Grid container spacing={3} alignItems="center">
          <NotFoundContent isMobile={isMobile} handleGoBack={handleGoBack} />
          <MascotSection isMobile={isMobile} />
        </Grid>
      </Paper>
    </Container>
  );
};

export default React.memo(NotFound); 