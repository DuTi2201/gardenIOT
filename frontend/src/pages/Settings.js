import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  useTheme,
  alpha
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Devices as DevicesIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';

// Import các components cài đặt
import NotificationSettings from '../components/settings/NotificationSettings';
import AccountSettings from '../components/settings/AccountSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import DeviceSettings from '../components/settings/DeviceSettings';
import LanguageSettings from '../components/settings/LanguageSettings';
import HelpSupport from '../components/settings/HelpSupport';

const Settings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    language: 'vi',
    darkMode: false,
    notifications: {
      email: true,
      push: true
    },
    autoConnect: true,
    dataRefreshInterval: 30
  });
  const { user, updateProfile, changePassword } = useAuth();
  const theme = useTheme();
  
  // Lấy đường dẫn hiện tại
  const currentPath = location.pathname;
  const currentTab = currentPath.split('/settings/')[1] || 'account';
  
  // Danh sách các tabs
  const tabs = [
    { value: 'account', label: 'Tài khoản', icon: <AccountIcon />, component: AccountSettings },
    { value: 'security', label: 'Bảo mật', icon: <SecurityIcon />, component: SecuritySettings },
    { value: 'notifications', label: 'Thông báo', icon: <NotificationsIcon />, component: NotificationSettings },
    { value: 'devices', label: 'Thiết bị', icon: <DevicesIcon />, component: DeviceSettings },
    { value: 'language', label: 'Ngôn ngữ', icon: <LanguageIcon />, component: LanguageSettings },
    { value: 'help', label: 'Trợ giúp', icon: <HelpIcon />, component: HelpSupport },
  ];
  
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        if (user) {
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || '',
          }));

          if (user._id) {
            try {
              const response = await axios.get('/auth/settings');
              if (response.data && response.data.success) {
                const settings = response.data.settings || {};
                
                setFormData(prev => ({
                  ...prev,
                  language: settings.language || prev.language,
                  darkMode: settings.darkMode || prev.darkMode,
                  notifications: {
                    email: settings.notifications?.email ?? prev.notifications.email,
                    push: settings.notifications?.push ?? prev.notifications.push
                  },
                  autoConnect: settings.autoConnect ?? prev.autoConnect,
                  dataRefreshInterval: settings.dataRefreshInterval || prev.dataRefreshInterval
                }));
                
                applyDarkMode(settings.darkMode);
              }
            } catch (err) {
              console.error('Lỗi khi tải cài đặt người dùng:', err);
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi khởi tạo cài đặt:', err);
      }
    };

    loadUserSettings();
  }, [user]);

  const applyDarkMode = (isDarkMode) => {
    localStorage.setItem('darkMode', isDarkMode);
    
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    console.log(`Đã ${isDarkMode ? 'bật' : 'tắt'} chế độ tối`);
  };

  const handleTabChange = (event, newValue) => {
    navigate(`/settings/${newValue}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name) => (e) => {
    const isChecked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      [name]: isChecked
    }));
    
    if (name === 'darkMode') {
      applyDarkMode(isChecked);
    }
  };

  const handleNotificationChange = (type) => (e) => {
    const isChecked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: isChecked
      }
    }));
    
    if (type === 'push') {
      handlePushNotificationChange(isChecked);
    }
  };
  
  const handlePushNotificationChange = async (isEnabled) => {
    if (!('Notification' in window)) {
      toast.warning('Trình duyệt của bạn không hỗ trợ thông báo đẩy');
      return;
    }
    
    try {
      if (isEnabled) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.warning('Bạn cần cấp quyền thông báo để nhận thông báo đẩy');
          setFormData(prev => ({
            ...prev,
            notifications: {
              ...prev.notifications,
              push: false
            }
          }));
        } else {
          toast.success('Đã bật thông báo đẩy');
        }
      } else {
        toast.info('Đã tắt thông báo đẩy');
      }
      
      await axios.post('/auth/notifications/settings', {
        pushEnabled: isEnabled
      });
    } catch (err) {
      console.error('Lỗi khi cập nhật cài đặt thông báo đẩy:', err);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = {
        name: formData.name,
        email: formData.email
      };
      
      const success = await updateProfile(userData);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const passwordData = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      };
      
      const success = await changePassword(passwordData);
      
      if (success) {
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const settingsData = {
        settings: {
          language: formData.language,
          darkMode: formData.darkMode,
          notifications: formData.notifications,
          autoConnect: formData.autoConnect,
          dataRefreshInterval: formData.dataRefreshInterval
        }
      };
      
      const response = await axios.put('/auth/settings', settingsData);
      
      if (response.data.success) {
        if (updateProfile) {
          await updateProfile({ settings: settingsData.settings });
        }
        
        applyDarkMode(formData.darkMode);
        
        document.documentElement.lang = formData.language;
        
        localStorage.setItem('dataRefreshInterval', formData.dataRefreshInterval);
        
        toast.success('Cài đặt đã được lưu thành công!');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Lỗi khi lưu cài đặt:', err);
      setError('Có lỗi xảy ra khi lưu cài đặt. Vui lòng thử lại sau.');
      toast.error('Có lỗi xảy ra khi lưu cài đặt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper 
            sx={{ 
              p: 0, 
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              height: '100%',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Cài đặt
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Quản lý tài khoản và tùy chỉnh ứng dụng
              </Typography>
            </Box>
            
            <List sx={{ p: 1 }}>
              {tabs.map((tab) => (
                <ListItem
                  button
                  key={tab.value}
                  selected={currentTab === tab.value}
                  onClick={() => navigate(`/settings/${tab.value}`)}
                  sx={{ 
                    borderRadius: 2,
                    mb: 0.5,
                    mx: 1,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 45, color: currentTab === tab.value ? 'primary.main' : 'inherit' }}>
                    {tab.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={tab.label} 
                    primaryTypographyProps={{ 
                      fontWeight: currentTab === tab.value ? 600 : 400,
                      fontSize: '0.95rem'
                    }} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              minHeight: 600
            }}
          >
            <Routes>
              <Route path="/" element={<AccountSettings />} />
              <Route path="/account" element={<AccountSettings />} />
              <Route path="/security" element={<SecuritySettings />} />
              <Route path="/notifications" element={<NotificationSettings />} />
              <Route path="/devices" element={<DeviceSettings />} />
              <Route path="/language" element={<LanguageSettings />} />
              <Route path="/help" element={<HelpSupport />} />
            </Routes>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;