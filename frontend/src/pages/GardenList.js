import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { getGardens, deleteGarden } from '../services/gardenService';
import { toast } from 'react-toastify';
import GardenActions from '../components/garden/GardenActions';

const GardenList = () => {
  const [gardens, setGardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedGarden, setSelectedGarden] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  useEffect(() => {
    fetchGardens();
  }, []);

  const fetchGardens = async () => {
    try {
      setLoading(true);
      console.log('GardenList - Đang gọi API getGardens');
      const response = await getGardens();
      console.log('GardenList - Phản hồi từ API:', response);
      
      // Kiểm tra cấu trúc dữ liệu
      if (response.success && Array.isArray(response.data)) {
        console.log('GardenList - Danh sách vườn nhận được:', response.data);
        setGardens(response.data);
      } else if (response.gardens && Array.isArray(response.gardens)) {
        console.log('GardenList - Danh sách vườn nhận được (từ response.gardens):', response.gardens);
        setGardens(response.gardens);
      } else {
        console.error('GardenList - Cấu trúc dữ liệu không đúng:', response);
        setGardens([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('GardenList - Lỗi khi lấy danh sách vườn:', err);
      setError(err.message || 'Lỗi khi tải danh sách vườn');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, garden) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedGarden(garden);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      await deleteGarden(selectedGarden.id);
      toast.success(`Vườn "${selectedGarden.name}" đã được xóa!`);
      setDeleteDialogOpen(false);
      // Cập nhật lại danh sách vườn
      fetchGardens();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa vườn');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Định dạng thời gian
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa kết nối';
    
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Hiển thị trạng thái kết nối
  const getConnectionStatus = (garden) => {
    if (!garden.last_connected) {
      return <Chip label="Chưa kết nối" color="error" size="small" />;
    }
    
    const lastConnected = new Date(garden.last_connected);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastConnected) / (1000 * 60));
    
    if (diffMinutes < 5) {
      return <Chip label="Đang kết nối" color="success" size="small" />;
    } else if (diffMinutes < 30) {
      return <Chip label="Kết nối gần đây" color="warning" size="small" />;
    } else {
      return <Chip label="Mất kết nối" color="error" size="small" />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
 
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Danh sách vườn
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/gardens/connect"
        >
          Thêm vườn mới
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : gardens.length === 0 ? (
        <Card sx={{ mb: 3, p: 3, textAlign: 'center' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Chưa có vườn nào
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Bạn chưa kết nối vườn nào. Hãy thêm vườn mới để bắt đầu giám sát và điều khiển.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={RouterLink}
              to="/gardens/connect"
              sx={{ mt: 2 }}
            >
              Thêm vườn mới
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {gardens.map((garden) => (
            <Grid item xs={12} sm={6} md={4} key={garden.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h2">
                      {garden.name}
                    </Typography>
                    {getConnectionStatus(garden)}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {garden.description || 'Không có mô tả'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Vị trí: {garden.location || 'Không có thông tin'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Mã serial: {garden.device_serial}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Kết nối cuối: {formatDate(garden.last_connected)}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'space-between', padding: 2 }}>
                  <Button 
                    size="small" 
                    component={RouterLink} 
                    to={`/gardens/${garden.id}`}
                    startIcon={<VisibilityIcon />}
                    variant="outlined"
                  >
                    Xem chi tiết
                  </Button>
                  
                  <GardenActions garden={garden} />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Menu tùy chọn */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          component={RouterLink} 
          to={selectedGarden ? `/gardens/${selectedGarden.id}` : '#'}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Chi tiết
        </MenuItem>
        <MenuItem 
          component={RouterLink} 
          to={selectedGarden ? `/gardens/${selectedGarden.id}/settings` : '#'}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Cài đặt
        </MenuItem>
        <MenuItem 
          component={RouterLink} 
          to={selectedGarden ? `/gardens/${selectedGarden.id}/schedules` : '#'}
          onClick={handleMenuClose}
        >
          <ListItemIcon>
            <ScheduleIcon fontSize="small" />
          </ListItemIcon>
          Lịch trình
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <Typography color="error">Xóa vườn</Typography>
        </MenuItem>
      </Menu>

      {/* Dialog xác nhận xóa */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>
          Xóa vườn
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa vườn "{selectedGarden?.name}"?
            Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
            Hủy
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GardenList; 