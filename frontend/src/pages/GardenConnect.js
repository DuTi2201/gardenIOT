import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import { connectGarden } from '../services/gardenService';
import { toast } from 'react-toastify';

const steps = ['Nhập thông tin vườn', 'Kết nối thiết bị', 'Hoàn tất'];

const GardenConnect = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    serial: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Xóa lỗi khi người dùng bắt đầu nhập lại
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    console.log('Đang xác thực form với dữ liệu:', formData);
    
    if (!formData.name.trim()) {
      errors.name = 'Tên vườn không được để trống';
    }
    
    // Chỉ kiểm tra serial khi ở bước 1
    if (activeStep === 1 && !formData.serial.trim()) {
      errors.serial = 'Mã serial không được để trống';
    }
    
    console.log('Kết quả xác thực form:', errors);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    console.log('Đã nhấn nút Tiếp theo, bước hiện tại:', activeStep);
    
    // Nếu ở bước đầu tiên, kiểm tra tên vườn
    if (activeStep === 0) {
      const isValid = validateForm();
      console.log('Form hợp lệ:', isValid);
      if (!isValid) {
        return;
      }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await connectGarden(formData);
      toast.success('Kết nối vườn thành công!');
      setActiveStep(2); // Chuyển đến bước hoàn tất
    } catch (err) {
      setError(err.message || 'Lỗi khi kết nối vườn');
      toast.error(err.message || 'Lỗi khi kết nối vườn');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/gardens');
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Thông tin vườn
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="name"
                  label="Tên vườn"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="description"
                  label="Mô tả"
                  name="description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="location"
                  label="Vị trí"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Kết nối thiết bị
            </Typography>
            <Typography variant="body2" paragraph>
              Nhập mã serial của thiết bị Wemos. Mã serial có thể được tìm thấy trên thiết bị hoặc trong thông tin được hiển thị trên màn hình LCD của thiết bị.
            </Typography>
            <TextField
              required
              fullWidth
              id="serial"
              label="Mã serial"
              name="serial"
              value={formData.serial}
              onChange={handleChange}
              error={!!formErrors.serial}
              helperText={formErrors.serial}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Kết nối thành công!
            </Typography>
            <Typography variant="body1" paragraph>
              Vườn "{formData.name}" đã được kết nối thành công với hệ thống.
            </Typography>
            <Typography variant="body1" paragraph>
              Bạn có thể bắt đầu giám sát và điều khiển vườn ngay bây giờ.
            </Typography>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Thêm vườn mới
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Paper sx={{ p: 3, mb: 3 }}>
            {getStepContent(activeStep)}
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0 || loading || activeStep === 2}
              onClick={handleBack}
            >
              Quay lại
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleFinish}
                  disabled={loading}
                >
                  Hoàn tất
                </Button>
              ) : activeStep === 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Kết nối'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Tiếp theo
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GardenConnect; 