import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  styled,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Security as SecurityIcon,
  LockReset as LockResetIcon,
  Logout as LogoutIcon,
  HistoryToggleOff as HistoryIcon,
  Smartphone as SmartphoneIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const SecurityCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
  transition: 'transform 0.3s ease',
  marginBottom: theme.spacing(3),
  '&:hover': {
    transform: 'translateY(-5px)',
  }
}));

const SessionItem = styled(ListItem)(({ theme, active }) => ({
  borderRadius: 8,
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1, 2),
  backgroundColor: active ? theme.palette.success.light + '20' : theme.palette.grey[100],
  '&:hover': {
    backgroundColor: active ? theme.palette.success.light + '30' : theme.palette.grey[200],
  }
}));

const SecuritySettings = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Mock session data
  const sessions = [
    {
      id: 1,
      device: 'Chrome trên MacBook Pro',
      location: 'Hà Nội, Việt Nam',
      ip: '192.168.1.1',
      lastActive: new Date(),
      current: true
    },
    {
      id: 2,
      device: 'Safari trên iPhone 14',
      location: 'Hà Nội, Việt Nam',
      ip: '192.168.1.2',
      lastActive: new Date(Date.now() - 86400000), // 1 day ago
      current: false
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleShowPassword = (field) => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    // Here you would actually enable/disable 2FA on the server
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mô phỏng API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = (sessionId) => {
    // Here you would actually terminate the session on the server
    alert(`Đã kết thúc phiên ${sessionId}`);
  };

  const handleTerminateAllSessions = () => {
    // Here you would actually terminate all sessions on the server
    alert('Đã kết thúc tất cả các phiên');
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Bảo mật tài khoản
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý mật khẩu và cài đặt bảo mật cho tài khoản của bạn
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Đổi mật khẩu thành công!
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SecurityCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LockResetIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Đổi mật khẩu
                </Typography>
              </Box>

              <TextField
                fullWidth
                margin="normal"
                type={showCurrentPassword ? 'text' : 'password'}
                label="Mật khẩu hiện tại"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleToggleShowPassword('current')}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                fullWidth
                margin="normal"
                type={showNewPassword ? 'text' : 'password'}
                label="Mật khẩu mới"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleToggleShowPassword('new')}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                fullWidth
                margin="normal"
                type={showConfirmPassword ? 'text' : 'password'}
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleToggleShowPassword('confirm')}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </Button>
              </Box>
            </CardContent>
          </SecurityCard>

          <SecurityCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SecurityIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Xác thực hai lớp
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Bảo vệ tài khoản của bạn bằng cách thêm một lớp bảo mật bổ sung khi đăng nhập
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="600">
                    Xác thực hai lớp
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {twoFactorEnabled ? 'Đã bật' : 'Đang tắt'}
                  </Typography>
                </Box>
                <Switch
                  checked={twoFactorEnabled}
                  onChange={handleTwoFactorToggle}
                  color="primary"
                  inputProps={{ 'aria-label': 'toggle 2FA' }}
                />
              </Box>
            </CardContent>
          </SecurityCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SecurityCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <HistoryIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="600">
                    Phiên đăng nhập
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<LogoutIcon />}
                  onClick={handleTerminateAllSessions}
                >
                  Kết thúc tất cả
                </Button>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Quản lý các thiết bị đang đăng nhập vào tài khoản của bạn
              </Typography>

              <List sx={{ p: 0 }}>
                {sessions.map(session => (
                  <SessionItem key={session.id} active={session.current}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SmartphoneIcon sx={{ mr: 1, color: session.current ? 'success.main' : 'text.secondary' }} />
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {session.device}
                            {session.current && (
                              <Chip
                                label="Hiện tại"
                                size="small"
                                color="success"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="text.secondary">
                              {session.location} • IP: {session.ip}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              Hoạt động cuối: {session.lastActive.toLocaleString('vi-VN')}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </Box>
                    <ListItemSecondaryAction>
                      {!session.current && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleTerminateSession(session.id)}
                        >
                          Kết thúc
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </SessionItem>
                ))}
              </List>
            </CardContent>
          </SecurityCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SecuritySettings; 