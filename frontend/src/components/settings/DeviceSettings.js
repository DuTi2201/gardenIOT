import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  Divider,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  styled,
  alpha
} from '@mui/material';
import {
  Devices as DevicesIcon,
  Router as RouterIcon,
  Sensors as SensorsIcon,
  WaterDrop as WaterDropIcon,
  Thermostat as ThermostatIcon,
  LightMode as LightModeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  LinkOff as LinkOffIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const DeviceCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
  }
}));

const DeviceItem = styled(ListItem)(({ theme, connected }) => ({
  borderRadius: 8,
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1.5, 2),
  backgroundColor: connected ? alpha(theme.palette.success.main, 0.07) : alpha(theme.palette.error.main, 0.07),
  border: `1px solid ${connected ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: connected ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
  }
}));

const getDeviceIcon = (type) => {
  switch (type) {
    case 'gateway':
      return <RouterIcon />;
    case 'sensor':
      return <SensorsIcon />;
    case 'water':
      return <WaterDropIcon />;
    case 'temperature':
      return <ThermostatIcon />;
    case 'light':
      return <LightModeIcon />;
    default:
      return <DevicesIcon />;
  }
};

const DeviceSettings = () => {
  const [devices, setDevices] = useState([
    { 
      id: 1, 
      name: 'Garden Gateway 1', 
      type: 'gateway', 
      location: 'Vườn cà chua', 
      status: 'connected', 
      lastActive: new Date(),
      battery: 100,
      firmware: '1.2.3',
      ipAddress: '192.168.1.10',
      autoConnect: true
    },
    { 
      id: 2, 
      name: 'Cảm biến độ ẩm đất', 
      type: 'sensor', 
      location: 'Vườn cà chua', 
      status: 'connected', 
      lastActive: new Date(Date.now() - 3600000), // 1 hour ago
      battery: 84,
      firmware: '1.1.0',
      autoConnect: true
    },
    { 
      id: 3, 
      name: 'Cảm biến nhiệt độ', 
      type: 'temperature', 
      location: 'Vườn cà chua', 
      status: 'disconnected', 
      lastActive: new Date(Date.now() - 86400000), // 1 day ago
      battery: 12,
      firmware: '1.0.7',
      autoConnect: false
    },
    { 
      id: 4, 
      name: 'Van tưới tự động', 
      type: 'water', 
      location: 'Vườn rau xanh', 
      status: 'connected', 
      lastActive: new Date(Date.now() - 7200000), // 2 hours ago
      battery: 76,
      firmware: '1.1.5',
      autoConnect: true
    }
  ]);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const handleToggleAutoConnect = (deviceId) => {
    setDevices(prev =>
      prev.map(device =>
        device.id === deviceId
          ? { ...device, autoConnect: !device.autoConnect }
          : device
      )
    );
  };
  
  const handleEditDevice = (device) => {
    setEditDevice({ ...device });
    setOpenDialog(true);
  };
  
  const handleDeleteDevice = (deviceId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này không?')) {
      setDevices(prev => prev.filter(device => device.id !== deviceId));
      setSuccess('Đã xóa thiết bị thành công!');
      setTimeout(() => setSuccess(null), 3000);
    }
  };
  
  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditDevice(null);
  };
  
  const handleSaveDevice = () => {
    setLoading(true);
    
    // Mô phỏng lưu
    setTimeout(() => {
      setDevices(prev =>
        prev.map(device =>
          device.id === editDevice.id
            ? { ...device, ...editDevice }
            : device
        )
      );
      
      setLoading(false);
      setOpenDialog(false);
      setSuccess('Đã cập nhật thiết bị thành công!');
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditDevice(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleRefreshDevices = () => {
    setScanning(true);
    
    // Mô phỏng quét
    setTimeout(() => {
      setScanning(false);
      setSuccess('Đã làm mới trạng thái thiết bị!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Mô phỏng cập nhật trạng thái
      setDevices(prev =>
        prev.map(device => ({
          ...device,
          lastActive: device.status === 'connected' ? new Date() : device.lastActive
        }))
      );
    }, 2000);
  };
  
  const handleAddDevice = () => {
    alert('Tính năng thêm thiết bị mới sẽ sử dụng quy trình kết nối thực tế');
  };
  
  const handleConnectDevice = (deviceId) => {
    setLoading(true);
    
    // Mô phỏng kết nối
    setTimeout(() => {
      setDevices(prev =>
        prev.map(device =>
          device.id === deviceId
            ? { ...device, status: 'connected', lastActive: new Date() }
            : device
        )
      );
      
      setLoading(false);
      setSuccess('Đã kết nối thiết bị thành công!');
      setTimeout(() => setSuccess(null), 3000);
    }, 1500);
  };
  
  const handleDisconnectDevice = (deviceId) => {
    setLoading(true);
    
    // Mô phỏng ngắt kết nối
    setTimeout(() => {
      setDevices(prev =>
        prev.map(device =>
          device.id === deviceId
            ? { ...device, status: 'disconnected' }
            : device
        )
      );
      
      setLoading(false);
      setSuccess('Đã ngắt kết nối thiết bị!');
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };
  
  const getBatteryColor = (level) => {
    if (level > 70) return 'success';
    if (level > 30) return 'warning';
    return 'error';
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            Quản lý thiết bị
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý các thiết bị IoT được kết nối với vườn của bạn
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshDevices}
            disabled={scanning}
          >
            {scanning ? 'Đang quét...' : 'Làm mới'}
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddDevice}
          >
            Thêm thiết bị
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <DeviceCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <DevicesIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Thiết bị của tôi
                </Typography>
              </Box>
              
              <List sx={{ p: 0 }}>
                {devices.map(device => (
                  <DeviceItem key={device.id} connected={device.status === 'connected'}>
                    <ListItemIcon sx={{ color: device.status === 'connected' ? 'success.main' : 'error.main' }}>
                      {getDeviceIcon(device.type)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight="600">
                            {device.name}
                          </Typography>
                          <Chip
                            label={device.status === 'connected' ? 'Đang kết nối' : 'Ngắt kết nối'}
                            size="small"
                            color={device.status === 'connected' ? 'success' : 'error'}
                            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                          />
                          {device.battery && (
                            <Tooltip title={`Pin: ${device.battery}%`}>
                              <Chip
                                label={`${device.battery}%`}
                                size="small"
                                color={getBatteryColor(device.battery)}
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2" color="text.secondary">
                            {device.location} • {device.type === 'gateway' ? `IP: ${device.ipAddress}` : `Firmware: ${device.firmware}`}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="text.secondary">
                            Hoạt động cuối: {device.lastActive.toLocaleString('vi-VN')}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {device.status === 'connected' ? (
                          <Tooltip title="Ngắt kết nối">
                            <IconButton
                              edge="end"
                              color="default"
                              onClick={() => handleDisconnectDevice(device.id)}
                              disabled={loading}
                            >
                              <LinkOffIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Kết nối">
                            <IconButton
                              edge="end"
                              color="primary"
                              onClick={() => handleConnectDevice(device.id)}
                              disabled={loading}
                            >
                              <LinkIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            edge="end"
                            color="info"
                            onClick={() => handleEditDevice(device)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Xóa">
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => handleDeleteDevice(device.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </DeviceItem>
                ))}
              </List>
            </CardContent>
          </DeviceCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <DeviceCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SettingsIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Tùy chọn thiết bị
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Quản lý cài đặt kết nối và tự động hóa cho thiết bị của bạn
              </Typography>
              
              <List sx={{ p: 0 }}>
                {devices.map(device => (
                  <ListItem
                    key={`setting-${device.id}`}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      p: 1.5,
                      bgcolor: 'background.paper',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                  >
                    <ListItemText
                      primary={device.name}
                      secondary="Tự động kết nối khi khởi động"
                    />
                    <Switch
                      edge="end"
                      checked={device.autoConnect}
                      onChange={() => handleToggleAutoConnect(device.id)}
                      color="primary"
                    />
                  </ListItem>
                ))}
              </List>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="600">
                  Tóm tắt thiết bị
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body2">Tổng thiết bị:</Typography>
                  <Typography variant="body2" fontWeight="600">{devices.length}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: alpha('#4caf50', 0.1), borderRadius: 1 }}>
                  <Typography variant="body2">Đang kết nối:</Typography>
                  <Typography variant="body2" fontWeight="600" color="success.main">
                    {devices.filter(d => d.status === 'connected').length}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: alpha('#f44336', 0.1), borderRadius: 1 }}>
                  <Typography variant="body2">Ngắt kết nối:</Typography>
                  <Typography variant="body2" fontWeight="600" color="error.main">
                    {devices.filter(d => d.status === 'disconnected').length}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: alpha('#ff9800', 0.1), borderRadius: 1 }}>
                  <Typography variant="body2">Cần sạc pin:</Typography>
                  <Typography variant="body2" fontWeight="600" color="warning.main">
                    {devices.filter(d => d.battery < 30).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </DeviceCard>
        </Grid>
      </Grid>
      
      {/* Hộp thoại chỉnh sửa thiết bị */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh sửa thiết bị</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Cập nhật thông tin cho thiết bị của bạn
          </DialogContentText>
          
          {editDevice && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tên thiết bị"
                  name="name"
                  value={editDevice.name}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Vị trí"
                  name="location"
                  value={editDevice.location}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
              
              {editDevice.type === 'gateway' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Địa chỉ IP"
                    name="ipAddress"
                    value={editDevice.ipAddress}
                    onChange={handleInputChange}
                    variant="outlined"
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            Hủy
          </Button>
          <Button 
            onClick={handleSaveDevice}
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceSettings; 