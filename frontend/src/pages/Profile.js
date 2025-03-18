import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Key as KeyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);
  
  const [userInfo, setUserInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
  });
  
  const [passwordInfo, setPasswordInfo] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  
  // Xử lý thay đổi thông tin cơ bản
  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo({
      ...userInfo,
      [name]: value,
    });
    
    // Xóa lỗi khi người dùng bắt đầu nhập lại
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // Xử lý thay đổi thông tin mật khẩu
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordInfo({
      ...passwordInfo,
      [name]: value,
    });
    
    // Xóa lỗi khi người dùng bắt đầu nhập lại
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // Chuyển đổi hiển thị mật khẩu
  const handleTogglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field],
    });
  };
  
  // Xác thực form thông tin cơ bản
  const validateUserInfo = () => {
    const newErrors = {};
    
    if (!userInfo.name.trim()) {
      newErrors.name = 'Họ tên không được để trống';
    }
    
    if (!userInfo.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(userInfo.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!userInfo.username.trim()) {
      newErrors.username = 'Tên đăng nhập không được để trống';
    } else if (userInfo.username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Xác thực form đổi mật khẩu
  const validatePasswordChange = () => {
    const newErrors = {};
    
    if (!passwordInfo.currentPassword) {
      newErrors.currentPassword = 'Mật khẩu hiện tại không được để trống';
    }
    
    if (!passwordInfo.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới không được để trống';
    } else if (passwordInfo.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }
    
    if (!passwordInfo.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
    } else if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Lưu thông tin cơ bản
  const handleSaveUserInfo = async () => {
    if (!validateUserInfo()) {
      return;
    }
    
    try {
      setLoading(true);
      await updateProfile(userInfo);
      setEditMode(false);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };
  
  // Đổi mật khẩu
  const handleChangePassword = async () => {
    if (!validatePasswordChange()) {
      return;
    }
    
    try {
      setLoading(true);
      await changePassword(passwordInfo);
      setChangePasswordMode(false);
      setPasswordInfo({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      toast.error(err.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };
  
  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    setEditMode(false);
    setUserInfo({
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || '',
    });
    setErrors({});
  };
  
  // Hủy đổi mật khẩu
  const handleCancelPasswordChange = () => {
    setChangePasswordMode(false);
    setPasswordInfo({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
  };
  
  // Hiển thị dialog xác nhận đăng xuất
  const handleLogoutClick = () => {
    setLogoutDialog(true);
  };
  
  // Đóng dialog đăng xuất
  const handleCloseLogoutDialog = () => {
    setLogoutDialog(false);
  };
  
  // Thực hiện đăng xuất
  const handleLogout = () => {
    logout();
    setLogoutDialog(false);
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Hồ sơ cá nhân
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" component="h2">
                  Thông tin cá nhân
                </Typography>
                {!editMode && (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode(true)}
                  >
                    Chỉnh sửa
                  </Button>
                )}
              </Box>
              
              {editMode ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Họ tên"
                      name="name"
                      value={userInfo.name}
                      onChange={handleUserInfoChange}
                      error={!!errors.name}
                      helperText={errors.name}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Tên đăng nhập"
                      name="username"
                      value={userInfo.username}
                      onChange={handleUserInfoChange}
                      error={!!errors.username}
                      helperText={errors.username}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={userInfo.email}
                      onChange={handleUserInfoChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                      <Button 
                        variant="outlined" 
                        onClick={handleCancelEdit}
                        disabled={loading}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveUserInfo}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Lưu thông tin'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Họ tên
                    </Typography>
                    <Typography variant="body1">
                      {user?.name || 'Chưa cập nhật'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Tên đăng nhập
                    </Typography>
                    <Typography variant="body1">
                      {user?.username || 'Chưa cập nhật'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {user?.email || 'Chưa cập nhật'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" component="h2">
                  Mật khẩu
                </Typography>
                {!changePasswordMode && (
                  <Button
                    variant="outlined"
                    startIcon={<KeyIcon />}
                    onClick={() => setChangePasswordMode(true)}
                  >
                    Đổi mật khẩu
                  </Button>
                )}
              </Box>
              
              {changePasswordMode ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mật khẩu hiện tại"
                      name="currentPassword"
                      type={showPassword.currentPassword ? 'text' : 'password'}
                      value={passwordInfo.currentPassword}
                      onChange={handlePasswordChange}
                      error={!!errors.currentPassword}
                      helperText={errors.currentPassword}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('currentPassword')}
                              edge="end"
                            >
                              {showPassword.currentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mật khẩu mới"
                      name="newPassword"
                      type={showPassword.newPassword ? 'text' : 'password'}
                      value={passwordInfo.newPassword}
                      onChange={handlePasswordChange}
                      error={!!errors.newPassword}
                      helperText={errors.newPassword}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('newPassword')}
                              edge="end"
                            >
                              {showPassword.newPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Xác nhận mật khẩu mới"
                      name="confirmPassword"
                      type={showPassword.confirmPassword ? 'text' : 'password'}
                      value={passwordInfo.confirmPassword}
                      onChange={handlePasswordChange}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('confirmPassword')}
                              edge="end"
                            >
                              {showPassword.confirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                      <Button 
                        variant="outlined" 
                        onClick={handleCancelPasswordChange}
                        disabled={loading}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleChangePassword}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Lưu mật khẩu'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Để bảo mật thông tin, nên thay đổi mật khẩu định kỳ.
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    Mật khẩu của bạn đã được mã hóa và bảo vệ an toàn.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Phiên đăng nhập
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1">
                  Đăng xuất khỏi tất cả thiết bị
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogoutClick}
                >
                  Đăng xuất
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Dialog xác nhận đăng xuất */}
      <Dialog
        open={logoutDialog}
        onClose={handleCloseLogoutDialog}
      >
        <DialogTitle>
          Đăng xuất
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLogoutDialog}>
            Hủy
          </Button>
          <Button 
            onClick={handleLogout} 
            color="error"
          >
            Đăng xuất
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile; 