import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  TextField,
  Slider,
  Divider,
  IconButton,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Thermostat as ThermostatIcon,
  WaterDrop as WaterDropIcon,
  WbSunny as SunIcon,
  Grass as GrassIcon,
} from '@mui/icons-material';
import { getGardenById, updateGarden, updateGardenSettings, deleteGarden } from '../services/gardenService';
import { toast } from 'react-toastify';

const GardenSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
  });
  
  const [thresholds, setThresholds] = useState({
    temperature_threshold_high: 30,
    temperature_threshold_low: 28,
    humidity_threshold_high: 70,
    humidity_threshold_low: 50,
    light_threshold_high: 50,
    light_threshold_low: 30,
    soil_threshold_high: 60,
    soil_threshold_low: 30,
  });
  
  useEffect(() => {
    const fetchGarden = async () => {
      try {
        setLoading(true);
        const response = await getGardenById(id);
        
        console.log('Phản hồi từ getGardenById:', response);
        
        // Kiểm tra xem response.garden có tồn tại không
        if (!response || !response.garden) {
          console.error('Không tìm thấy dữ liệu garden trong phản hồi:', response);
          setError('Không tìm thấy thông tin vườn');
          setLoading(false);
          return;
        }
        
        setGarden(response.garden);
        
        // Cập nhật form data
        setFormData({
          name: response.garden.name || '',
          description: response.garden.description || '',
          location: response.garden.location || '',
        });
        
        // Cập nhật ngưỡng
        if (response.garden.settings) {
          setThresholds({
            temperature_threshold_high: response.garden.settings.temperature_threshold_high || 30,
            temperature_threshold_low: response.garden.settings.temperature_threshold_low || 28,
            humidity_threshold_high: response.garden.settings.humidity_threshold_high || 70,
            humidity_threshold_low: response.garden.settings.humidity_threshold_low || 50,
            light_threshold_high: response.garden.settings.light_threshold_high || 50,
            light_threshold_low: response.garden.settings.light_threshold_low || 30,
            soil_threshold_high: response.garden.settings.soil_threshold_high || 60,
            soil_threshold_low: response.garden.settings.soil_threshold_low || 30,
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Lỗi trong fetchGarden:', err);
        setError(err.message || 'Lỗi khi tải thông tin vườn');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGarden();
  }, [id]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleThresholdChange = (name, values) => {
    setThresholds({
      ...thresholds,
      [name + '_low']: values[0],
      [name + '_high']: values[1],
    });
  };
  
  const handleSaveBasicInfo = async () => {
    try {
      setSaveLoading(true);
      await updateGarden(id, formData);
      toast.success('Thông tin vườn đã được cập nhật');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi cập nhật thông tin vườn');
    } finally {
      setSaveLoading(false);
    }
  };
  
  const handleSaveThresholds = async () => {
    try {
      setSaveLoading(true);
      await updateGardenSettings(id, { settings: thresholds });
      toast.success('Cài đặt ngưỡng đã được cập nhật');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi cập nhật cài đặt ngưỡng');
    } finally {
      setSaveLoading(false);
    }
  };
  
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      await deleteGarden(id);
      toast.success(`Vườn "${garden.name}" đã được xóa!`);
      setDeleteDialogOpen(false);
      navigate('/gardens');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa vườn');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }
  
  if (!garden) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        Không tìm thấy thông tin vườn
      </Alert>
    );
  }
  
  return (
    <Box>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/gardens" color="inherit">
          Danh sách vườn
        </Link>
        <Link component={RouterLink} to={`/gardens/${id}`} color="inherit">
          {garden.name}
        </Link>
        <Typography color="text.primary">Cài đặt</Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton component={RouterLink} to={`/gardens/${id}`} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Cài đặt vườn
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDeleteClick}
        >
          Xóa vườn
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Thông tin cơ bản */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Thông tin cơ bản
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tên vườn"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mô tả"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Vị trí"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mã serial"
                    value={garden.device_serial}
                    disabled
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveBasicInfo}
                  disabled={saveLoading}
                >
                  {saveLoading ? <CircularProgress size={24} /> : 'Lưu thông tin'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Cài đặt ngưỡng */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Cài đặt ngưỡng kích hoạt
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Cài đặt ngưỡng kích hoạt/tắt thiết bị khi chế độ tự động được bật.
              </Alert>
              
              <Grid container spacing={3}>
                {/* Ngưỡng nhiệt độ */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ThermostatIcon color="error" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Ngưỡng nhiệt độ (°C)</Typography>
                  </Box>
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={[thresholds.temperature_threshold_low, thresholds.temperature_threshold_high]}
                      onChange={(_, values) => handleThresholdChange('temperature', values)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={50}
                      step={0.5}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Tắt quạt khi nhiệt độ &lt; {thresholds.temperature_threshold_low}°C
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bật quạt khi nhiệt độ &gt; {thresholds.temperature_threshold_high}°C
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                {/* Ngưỡng độ ẩm không khí */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WaterDropIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Ngưỡng độ ẩm không khí (%)</Typography>
                  </Box>
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={[thresholds.humidity_threshold_low, thresholds.humidity_threshold_high]}
                      onChange={(_, values) => handleThresholdChange('humidity', values)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Ngưỡng thấp: {thresholds.humidity_threshold_low}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ngưỡng cao: {thresholds.humidity_threshold_high}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                {/* Ngưỡng ánh sáng */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SunIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Ngưỡng ánh sáng (%)</Typography>
                  </Box>
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={[thresholds.light_threshold_low, thresholds.light_threshold_high]}
                      onChange={(_, values) => handleThresholdChange('light', values)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Bật đèn khi ánh sáng &lt; {thresholds.light_threshold_low}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tắt đèn khi ánh sáng &gt; {thresholds.light_threshold_high}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                
                {/* Ngưỡng độ ẩm đất */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <GrassIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Ngưỡng độ ẩm đất (%)</Typography>
                  </Box>
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={[thresholds.soil_threshold_low, thresholds.soil_threshold_high]}
                      onChange={(_, values) => handleThresholdChange('soil', values)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Bật máy bơm khi độ ẩm đất &lt; {thresholds.soil_threshold_low}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tắt máy bơm khi độ ẩm đất &gt; {thresholds.soil_threshold_high}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveThresholds}
                  disabled={saveLoading}
                >
                  {saveLoading ? <CircularProgress size={24} /> : 'Lưu cài đặt ngưỡng'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
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
            Bạn có chắc chắn muốn xóa vườn "{garden.name}"?
            Hành động này không thể hoàn tác và tất cả dữ liệu liên quan sẽ bị xóa.
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

export default GardenSettings; 