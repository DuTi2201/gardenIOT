import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Switch, 
  FormControlLabel, 
  Divider, 
  Button,
  Grid,
  Paper,
  alpha,
  IconButton,
  Stack,
  styled,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
  ListItem,
  ListItemIcon,
  ListItemText,
  List
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Spa as SpaIcon,
  Schedule as ScheduleIcon,
  WaterDrop as WaterDropIcon,
  WbSunny as WbSunnyIcon,
  Update as UpdateIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Hub as HubIcon,
  LaptopMac as DeviceIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';
import AnimatedMascot from '../common/AnimatedMascot';

// Styled components
const SettingCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  overflow: 'visible',
  position: 'relative',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
  }
}));

const CardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  display: 'flex',
  alignItems: 'center',
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
}));

const NotificationTypeItem = styled(ListItem)(({ theme, active }) => ({
  borderRadius: 8,
  marginBottom: theme.spacing(1),
  transition: 'all 0.2s ease',
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
  '&:hover': {
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.04),
  }
}));

const NotificationMascot = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: -20,
  right: -20,
  zIndex: 10,
  width: 100,
  height: 100,
}));

const NotificationSettings = () => {
  const { 
    notificationSettings, 
    updateNotificationSettings,
    clearAllNotifications,
    unreadCount,
    markAllAsRead
  } = useNotifications();
  
  const [settings, setSettings] = useState(notificationSettings);
  const [saved, setSaved] = useState(false);
  const [testSoundPlayed, setTestSoundPlayed] = useState(false);
  
  // Khôi phục cài đặt từ context
  useEffect(() => {
    setSettings(notificationSettings);
  }, [notificationSettings]);
  
  // Xử lý khi thay đổi cài đặt
  const handleChange = (event) => {
    const { name, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Lưu cài đặt
  const handleSave = () => {
    updateNotificationSettings(settings);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };
  
  // Phát âm thanh thông báo để thử
  const playTestSound = () => {
    if (settings.soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(830, audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
        
        setTestSoundPlayed(true);
        setTimeout(() => {
          setTestSoundPlayed(false);
        }, 2000);
      } catch (error) {
        console.error('Không thể phát âm thanh thông báo:', error);
      }
    }
  };
  
  // Khôi phục cài đặt mặc định
  const resetToDefault = () => {
    const defaultSettings = {
      systemNotifications: true,
      gardenAlerts: true,
      scheduledEvents: true,
      wateringReminders: true,
      weatherAlerts: true,
      newsAndUpdates: false,
      pushNotifications: true,
      emailNotifications: false,
      soundEnabled: true,
    };
    
    setSettings(defaultSettings);
  };
  
  // Xử lý xóa tất cả thông báo
  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo không?')) {
      clearAllNotifications();
    }
  };
  
  // Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            Cài đặt thông báo
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tùy chỉnh cách bạn nhận và hiển thị thông báo trong ứng dụng
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Đánh dấu tất cả là đã đọc">
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<VisibilityIcon />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Đã đọc tất cả
            </Button>
          </Tooltip>
          
          <Tooltip title="Xóa tất cả thông báo">
            <Button 
              variant="outlined" 
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleClearAll}
            >
              Xóa tất cả
            </Button>
          </Tooltip>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SettingCard>
            <CardHeader>
              <NotificationsIcon sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="600">
                Loại thông báo
              </Typography>
            </CardHeader>
            
            <CardContent>
              <List sx={{ p: 0 }}>
                <NotificationTypeItem active={settings.gardenAlerts}>
                  <ListItemIcon>
                    <SpaIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Cảnh báo vườn" 
                    secondary="Thông báo về nhiệt độ, độ ẩm và các chỉ số khác vượt ngưỡng" 
                  />
                  <Switch 
                    name="gardenAlerts"
                    checked={settings.gardenAlerts}
                    onChange={handleChange}
                    inputProps={{ 'aria-label': 'toggle garden alerts' }}
                  />
                </NotificationTypeItem>
                
                <NotificationTypeItem active={settings.scheduledEvents}>
                  <ListItemIcon>
                    <ScheduleIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Sự kiện theo lịch" 
                    secondary="Nhắc nhở về các nhiệm vụ và sự kiện đã lên lịch" 
                  />
                  <Switch 
                    name="scheduledEvents"
                    checked={settings.scheduledEvents}
                    onChange={handleChange}
                    inputProps={{ 'aria-label': 'toggle scheduled events' }}
                  />
                </NotificationTypeItem>
                
                <NotificationTypeItem active={settings.wateringReminders}>
                  <ListItemIcon>
                    <WaterDropIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Nhắc nhở tưới nước" 
                    secondary="Thông báo về việc tưới nước tự động và nhắc nhở tưới thủ công" 
                  />
                  <Switch 
                    name="wateringReminders"
                    checked={settings.wateringReminders}
                    onChange={handleChange}
                    inputProps={{ 'aria-label': 'toggle watering reminders' }}
                  />
                </NotificationTypeItem>
                
                <NotificationTypeItem active={settings.weatherAlerts}>
                  <ListItemIcon>
                    <WbSunnyIcon color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Cảnh báo thời tiết" 
                    secondary="Thông báo về thay đổi thời tiết có thể ảnh hưởng đến vườn" 
                  />
                  <Switch 
                    name="weatherAlerts"
                    checked={settings.weatherAlerts}
                    onChange={handleChange}
                    inputProps={{ 'aria-label': 'toggle weather alerts' }}
                  />
                </NotificationTypeItem>
                
                <NotificationTypeItem active={settings.systemNotifications}>
                  <ListItemIcon>
                    <HubIcon color="default" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Thông báo hệ thống" 
                    secondary="Thông báo về tình trạng kết nối và hoạt động của thiết bị" 
                  />
                  <Switch 
                    name="systemNotifications"
                    checked={settings.systemNotifications}
                    onChange={handleChange}
                    inputProps={{ 'aria-label': 'toggle system notifications' }}
                  />
                </NotificationTypeItem>
                
                <NotificationTypeItem active={settings.newsAndUpdates}>
                  <ListItemIcon>
                    <UpdateIcon color="default" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Tin tức và cập nhật" 
                    secondary="Thông báo về tính năng mới và cập nhật ứng dụng" 
                  />
                  <Switch 
                    name="newsAndUpdates"
                    checked={settings.newsAndUpdates}
                    onChange={handleChange}
                    inputProps={{ 'aria-label': 'toggle news and updates' }}
                  />
                </NotificationTypeItem>
              </List>
            </CardContent>
          </SettingCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <SettingCard sx={{ mb: 3, position: 'relative', overflow: 'hidden' }}>
            <CardHeader>
              <DeviceIcon sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="600">
                Kênh thông báo
              </Typography>
            </CardHeader>
            
            <CardContent>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Chọn cách bạn muốn nhận thông báo từ ứng dụng Garden IoT
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch 
                    name="pushNotifications"
                    checked={settings.pushNotifications}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationsActiveIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>Thông báo trong ứng dụng</Typography>
                  </Box>
                }
                sx={{ width: '100%', mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ mr: 1, color: 'info.main' }} />
                    <Typography>Thông báo qua email</Typography>
                  </Box>
                }
                sx={{ width: '100%', mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    name="soundEnabled"
                    checked={settings.soundEnabled}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {settings.soundEnabled ? (
                      <VolumeUpIcon sx={{ mr: 1, color: 'success.main' }} />
                    ) : (
                      <VolumeOffIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    )}
                    <Typography>Âm thanh thông báo</Typography>
                    {settings.soundEnabled && (
                      <Button 
                        size="small" 
                        variant="text" 
                        onClick={playTestSound}
                        sx={{ ml: 2, fontSize: '0.75rem' }}
                      >
                        Nghe thử
                      </Button>
                    )}
                  </Box>
                }
                sx={{ width: '100%' }}
              />
              
              <NotificationMascot>
                <AnimatedMascot size="small" useVideo={true} />
              </NotificationMascot>
            </CardContent>
          </SettingCard>
          
          <SettingCard>
            <CardHeader>
              <SettingsIcon sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="600">
                Tùy chọn khác
              </Typography>
            </CardHeader>
            
            <CardContent>
              <Stack spacing={2} direction="row" sx={{ mb: 3 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  fullWidth
                >
                  Lưu cài đặt
                </Button>
                
                <Button 
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={resetToDefault}
                  fullWidth
                >
                  Khôi phục mặc định
                </Button>
              </Stack>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Trạng thái:
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {settings.pushNotifications ? (
                  <Chip 
                    icon={<NotificationsActiveIcon />} 
                    label="Thông báo đang bật" 
                    color="success" 
                    variant="outlined" 
                    size="small"
                  />
                ) : (
                  <Chip 
                    icon={<NotificationsOffIcon />} 
                    label="Thông báo đã tắt"
                    color="error" 
                    variant="outlined" 
                    size="small"
                  />
                )}
                
                {settings.soundEnabled ? (
                  <Chip 
                    icon={<VolumeUpIcon />} 
                    label="Âm thanh đang bật" 
                    color="info" 
                    variant="outlined" 
                    size="small"
                  />
                ) : (
                  <Chip 
                    icon={<VolumeOffIcon />} 
                    label="Âm thanh đã tắt"
                    color="default" 
                    variant="outlined" 
                    size="small"
                  />
                )}
              </Box>
            </CardContent>
          </SettingCard>
        </Grid>
      </Grid>
      
      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          Đã lưu cài đặt thông báo thành công
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={testSoundPlayed}
        autoHideDuration={2000}
        onClose={() => setTestSoundPlayed(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled">
          Đã phát âm thanh thông báo
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationSettings; 