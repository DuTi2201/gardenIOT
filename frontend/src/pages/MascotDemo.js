import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Divider,
  Card,
  CardContent,
  CardActions,
  FormControlLabel,
  Switch,
  Chip,
  useTheme,
} from '@mui/material';
import AnimatedMascot from '../components/common/AnimatedMascot';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';
import MascotAlert from '../components/common/MascotAlert';
import { useMascotAlert } from '../context/MascotAlertContext';

// Tạo trang demo để kiểm tra các tính năng của linh vật
const MascotDemo = () => {
  const theme = useTheme();
  const [useVideo, setUseVideo] = useState(true);
  const [showEmpty, setShowEmpty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertVariant, setAlertVariant] = useState('inline');
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState('info');
  
  // Sử dụng context để hiển thị thông báo
  const mascotAlert = useMascotAlert();

  // Bắt đầu/dừng loading
  const toggleLoading = () => {
    setIsLoading(prev => !prev);
    // Nếu bắt đầu loading, tự động dừng sau 3 giây
    if (!isLoading) {
      setTimeout(() => {
        setIsLoading(false);
        mascotAlert.success('Đã tải xong dữ liệu!');
      }, 3000);
    }
  };

  // Hiển thị thông báo với context
  const showContextAlert = (type) => {
    switch (type) {
      case 'success':
        mascotAlert.success('Thao tác thành công!', { useVideo });
        break;
      case 'error':
        mascotAlert.error('Đã xảy ra lỗi!', { useVideo });
        break;
      case 'warning':
        mascotAlert.warning('Cảnh báo: Hãy kiểm tra lại thông tin.', { useVideo });
        break;
      case 'info':
        mascotAlert.info('Đây là thông báo thông tin.', { useVideo });
        break;
      case 'confirm':
        mascotAlert.confirm('Bạn có chắc chắn muốn thực hiện thao tác này?', {
          useVideo,
          onClose: (result) => {
            if (result) {
              mascotAlert.success('Bạn đã xác nhận thao tác!');
            }
          }
        });
        break;
      default:
        break;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: theme.palette.primary.main }}>
        Demo Linh Vật Tương Tác
      </Typography>

      <Grid container spacing={4}>
        {/* Section 1: Linh vật với các kích thước */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Linh vật với các kích thước khác nhau
            </Typography>
            <FormControlLabel
              control={<Switch checked={useVideo} onChange={() => setUseVideo(!useVideo)} />}
              label="Sử dụng video"
            />
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, mt: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
                  Small
                </Typography>
                <AnimatedMascot size="small" useVideo={useVideo} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
                  Medium
                </Typography>
                <AnimatedMascot size="medium" useVideo={useVideo} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
                  Large
                </Typography>
                <AnimatedMascot size="large" useVideo={useVideo} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Section 2: Trạng thái trống */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Trạng thái trống (Empty State)
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setShowEmpty(!showEmpty)}
              sx={{ mb: 2 }}
            >
              {showEmpty ? 'Ẩn' : 'Hiện'} trạng thái trống
            </Button>
            
            {showEmpty ? (
              <EmptyState 
                title="Không có dữ liệu" 
                message="Chưa có dữ liệu nào trong hệ thống. Bạn có thể tạo mới để bắt đầu."
                actionText="Tạo mới"
                onAction={() => alert('Tạo mới dữ liệu')}
                useVideo={useVideo}
              />
            ) : (
              <Box 
                sx={{ 
                  height: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 2
                }}
              >
                <Typography color="text.secondary">
                  Nhấn nút bên trên để hiển thị trạng thái trống
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Section 3: Trạng thái loading */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Trạng thái đang tải (Loading)
            </Typography>
            <Button 
              variant="contained" 
              onClick={toggleLoading}
              sx={{ mb: 2 }}
            >
              {isLoading ? 'Dừng' : 'Bắt đầu'} trạng thái loading
            </Button>

            <Box 
              sx={{ 
                height: 300, 
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2,
                position: 'relative'
              }}
            >
              {isLoading ? (
                <LoadingState 
                  message="Đang tải dữ liệu..." 
                  variant="mascot"
                  useVideo={useVideo}
                />
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%'
                }}>
                  <Typography color="text.secondary">
                    Nhấn nút bên trên để hiển thị trạng thái loading
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Section 4: Thông báo (Alert) */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Thông báo với linh vật
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Kiểu thông báo:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label="Inline" 
                  onClick={() => setAlertVariant('inline')}
                  color={alertVariant === 'inline' ? 'primary' : 'default'}
                />
                <Chip 
                  label="Toast" 
                  onClick={() => setAlertVariant('toast')}
                  color={alertVariant === 'toast' ? 'primary' : 'default'}
                />
                <Chip 
                  label="Dialog" 
                  onClick={() => setAlertVariant('dialog')}
                  color={alertVariant === 'dialog' ? 'primary' : 'default'}
                />
              </Box>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Loại thông báo:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label="Success" 
                  onClick={() => setAlertType('success')}
                  color={alertType === 'success' ? 'success' : 'default'}
                />
                <Chip 
                  label="Error" 
                  onClick={() => setAlertType('error')}
                  color={alertType === 'error' ? 'error' : 'default'}
                />
                <Chip 
                  label="Warning" 
                  onClick={() => setAlertType('warning')}
                  color={alertType === 'warning' ? 'warning' : 'default'}
                />
                <Chip 
                  label="Info" 
                  onClick={() => setAlertType('info')}
                  color={alertType === 'info' ? 'info' : 'default'}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                onClick={() => setShowAlert(!showAlert)}
                color={alertType === 'error' ? 'error' : alertType === 'warning' ? 'warning' : alertType === 'success' ? 'success' : 'primary'}
              >
                {showAlert ? 'Ẩn' : 'Hiện'} thông báo (Component)
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => showContextAlert(alertType)}
              >
                Hiện thông báo (Context)
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={() => showContextAlert('confirm')}
                color="warning"
              >
                Hiện hộp thoại xác nhận
              </Button>
            </Box>
            
            {showAlert && alertVariant === 'inline' && (
              <Box sx={{ mt: 3 }}>
                <MascotAlert
                  type={alertType}
                  variant={alertVariant}
                  title={`Thông báo ${alertType}`}
                  message={`Đây là nội dung thông báo kiểu ${alertType} ở dạng ${alertVariant}.`}
                  onClose={() => setShowAlert(false)}
                  useVideo={useVideo}
                />
              </Box>
            )}
            
            {showAlert && alertVariant === 'toast' && (
              <MascotAlert
                type={alertType}
                variant={alertVariant}
                title={`Thông báo ${alertType}`}
                message={`Đây là nội dung thông báo kiểu ${alertType} ở dạng ${alertVariant}.`}
                onClose={() => setShowAlert(false)}
                useVideo={useVideo}
              />
            )}
            
            {showAlert && alertVariant === 'dialog' && (
              <MascotAlert
                type={alertType}
                variant={alertVariant}
                title={`Thông báo ${alertType}`}
                message={`Đây là nội dung thông báo kiểu ${alertType} ở dạng ${alertVariant}.`}
                onClose={() => setShowAlert(false)}
                useVideo={useVideo}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MascotDemo; 