import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  styled
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  margin: '0 auto 20px auto',
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
  }
}));

const AvatarInput = styled('input')({
  display: 'none',
});

const ProfileCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
  }
}));

const AccountSettings = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // Mô phỏng cập nhật thành công
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Thông tin tài khoản
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý thông tin cá nhân và tùy chọn tài khoản của bạn
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Cập nhật thông tin thành công!
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <ProfileCard>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <label htmlFor="avatar-input">
                <AvatarInput
                  accept="image/*"
                  id="avatar-input"
                  type="file"
                  onChange={handleAvatarChange}
                />
                <ProfileAvatar
                  src={avatarPreview || (user && user.avatar) || '/linh_vat_2.png'}
                  alt={user ? user.name : 'Avatar'}
                >
                  {!avatarPreview && !user?.avatar && user?.name?.charAt(0)}
                </ProfileAvatar>
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: '50%',
                    transform: 'translateX(60px)',
                    bgcolor: 'background.paper',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': { bgcolor: 'background.paper' }
                  }}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </label>

              <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                {user?.name || 'Người dùng Garden'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || 'garden@example.com'}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Là thành viên từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Không xác định'}
              </Typography>
            </CardContent>
          </ProfileCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <ProfileCard>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                Thông tin cá nhân
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Họ và tên"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    variant="outlined"
                    disabled
                    helperText="Email không thể thay đổi sau khi đăng ký"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Số điện thoại"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Vị trí của bạn"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    variant="outlined"
                    placeholder="Ví dụ: Hà Nội, Việt Nam"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </Box>
            </CardContent>
          </ProfileCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AccountSettings; 