import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Stack,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import {
  Thermostat as ThermostatIcon,
  WaterDrop as WaterDropIcon,
  WbSunny as SunIcon,
  Grass as GrassIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Air as FanIcon,
  Lightbulb as LightIcon,
  Opacity as PumpIcon,
  PowerSettingsNew as PowerIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { getGardenById, getLatestSensorData, getSensorDataHistory } from '../services/gardenService';
import { getDevicesStatus, controlDevice, toggleAutoMode, turnOnAllDevices, turnOffAllDevices } from '../services/deviceService';
import { toast } from 'react-toastify';
import socketService from '../services/socketService';
import { formatDateTime } from '../utils/formatters';

// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend);

const GardenDetail = () => {
  const { id } = useParams();
  const [garden, setGarden] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState({
    fan: false,
    light: false,
    pump: false,
    auto: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [controlLoading, setControlLoading] = useState({
    fan: false,
    light: false,
    pump: false,
    auto: false,
    all: false,
  });
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [refreshing, setRefreshing] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('24h');
  const [lastChartUpdate, setLastChartUpdate] = useState(null);

  // Lấy thông tin vườn
  const fetchGarden = async () => {
    try {
      console.log(`Đang tải thông tin vườn với ID: ${id}`);
      const gardenResponse = await getGardenById(id);
      console.log('Phản hồi từ API getGardenById:', gardenResponse);
      
      // Kiểm tra cấu trúc dữ liệu
      let gardenData = null;
      
      if (gardenResponse.success && gardenResponse.data) {
        gardenData = gardenResponse.data;
      } else if (gardenResponse.garden) {
        gardenData = gardenResponse.garden;
      } else if (gardenResponse && !Array.isArray(gardenResponse) && typeof gardenResponse === 'object') {
        // Nếu response là một object, có thể đó là garden
        gardenData = gardenResponse;
      }
      
      if (!gardenData || !gardenData.name) {
        console.error('Không tìm thấy thông tin vườn hoặc dữ liệu không hợp lệ:', gardenResponse);
        toast.error('Không tìm thấy thông tin vườn');
        setError('Không tìm thấy thông tin vườn');
        return;
      }
      
      // Đảm bảo garden có _id
      if (gardenData.id && !gardenData._id) {
        gardenData._id = gardenData.id;
      }
      
      console.log('Dữ liệu vườn đã xử lý:', gardenData);
      setGarden(gardenData);
      
      // Cập nhật trạng thái kết nối
      if (gardenData.last_connected) {
        const lastConnected = new Date(gardenData.last_connected);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastConnected) / (1000 * 60));
        
        if (diffMinutes < 5) {
          setConnectionStatus('connected');
        } else if (diffMinutes < 30) {
          setConnectionStatus('recent');
        } else {
          setConnectionStatus('disconnected');
        }
      } else {
        setConnectionStatus('never');
      }
      
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải thông tin vườn:', err);
      setError('Lỗi khi tải thông tin vườn');
      toast.error('Lỗi khi tải thông tin vườn');
    }
  };

  // Lấy dữ liệu cảm biến mới nhất
  const fetchSensorData = async () => {
    try {
      console.log(`Đang tải dữ liệu cảm biến cho vườn ${id}`);
      const sensorResponse = await getLatestSensorData(id);
      console.log('Phản hồi từ API getLatestSensorData:', sensorResponse);
      
      // Kiểm tra cấu trúc dữ liệu
      if (sensorResponse && sensorResponse.data) {
        setSensorData(sensorResponse.data);
      } else if (sensorResponse && typeof sensorResponse === 'object') {
        // Nếu response là một object, có thể đó là dữ liệu cảm biến
        setSensorData(sensorResponse);
      } else {
        console.warn('Không tìm thấy dữ liệu cảm biến hoặc dữ liệu không hợp lệ:', sensorResponse);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu cảm biến:', err);
      toast.warning('Không thể tải dữ liệu cảm biến');
      // Không throw lỗi để tránh làm gián đoạn luồng
    }
  };

  // Lấy trạng thái thiết bị
  const fetchDeviceStatus = async () => {
    try {
      console.log(`Đang tải trạng thái thiết bị cho vườn ${id}`);
      const deviceResponse = await getDevicesStatus(id);
      console.log('Phản hồi từ API getDevicesStatus:', deviceResponse);
      
      // Kiểm tra cấu trúc dữ liệu
      if (deviceResponse && typeof deviceResponse === 'object') {
        setDeviceStatus({
          fan: deviceResponse.fan_status || false,
          light: deviceResponse.light_status || false,
          pump: deviceResponse.pump_status || false,
          auto: deviceResponse.auto_mode || false,
        });
      } else {
        console.warn('Không tìm thấy trạng thái thiết bị hoặc dữ liệu không hợp lệ:', deviceResponse);
      }
    } catch (err) {
      console.error('Lỗi khi tải trạng thái thiết bị:', err);
      toast.warning('Không thể tải trạng thái thiết bị');
      // Không throw lỗi để tránh làm gián đoạn luồng
    }
  };

  // Lấy thông tin vườn và dữ liệu cảm biến khi trang được tải
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Tải thông tin vườn trước
        await fetchGarden();
        
        // Sau đó tải dữ liệu cảm biến và thiết bị
        // Sử dụng Promise.allSettled để đảm bảo tất cả các yêu cầu được thực hiện
        // ngay cả khi một số yêu cầu thất bại
        const results = await Promise.allSettled([
          fetchSensorData(),
          fetchDeviceStatus(),
          fetchChartData(chartPeriod)
        ]);
        
        // Kiểm tra kết quả
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Yêu cầu thứ ${index + 1} thất bại:`, result.reason);
          }
        });
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        setError('Lỗi khi tải dữ liệu vườn');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Thiết lập kết nối socket
    socketService.initializeSocket();
    socketService.joinGardenRoom(id);
    
    // Lắng nghe sự kiện dữ liệu cảm biến mới
    socketService.onSensorDataUpdate((data) => {
      if (data.garden_id === id) {
        console.log('Nhận dữ liệu cảm biến mới qua socket:', data);
        setSensorData(data);
        setConnectionStatus('connected');
      }
    });
    
    // Lắng nghe sự kiện thay đổi trạng thái thiết bị
    socketService.onDeviceStatusUpdate((data) => {
      if (data.garden_id === id) {
        console.log('Nhận trạng thái thiết bị mới qua socket:', data);
        setDeviceStatus({
          fan: data.fan_status || false,
          light: data.light_status || false,
          pump: data.pump_status || false,
          auto: data.auto_mode || false,
        });
      }
    });
    
    // Thiết lập interval để cập nhật dữ liệu mỗi 30 giây
    const intervalId = setInterval(() => {
      fetchSensorData().catch(err => console.error('Lỗi khi cập nhật dữ liệu cảm biến:', err));
      fetchDeviceStatus().catch(err => console.error('Lỗi khi cập nhật trạng thái thiết bị:', err));
    }, 30000);
    
    // Dọn dẹp khi component unmount
    return () => {
      clearInterval(intervalId);
      socketService.leaveGardenRoom(id);
    };
  }, [id, chartPeriod]);

  // Lấy dữ liệu biểu đồ
  const fetchChartData = async (period = '24h') => {
    try {
      setChartLoading(true);
      
      // Lấy dữ liệu cảm biến theo khoảng thời gian được chọn
      const params = {
        duration: period,
      };
      
      console.log(`Đang lấy dữ liệu biểu đồ với khoảng thời gian: ${period}`);
      const response = await getSensorDataHistory(id, params);
      console.log('Phản hồi từ API getSensorDataHistory:', response);
      
      // Kiểm tra cấu trúc dữ liệu
      let chartData = [];
      if (response && response.data && Array.isArray(response.data)) {
        chartData = response.data;
      } else if (response && Array.isArray(response)) {
        chartData = response;
      }
      
      if (chartData.length > 0) {
        const labels = chartData.map((item) => {
          const date = new Date(item.timestamp);
          // Định dạng nhãn thời gian dựa trên khoảng thời gian
          if (period === '24h') {
            return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
          } else if (period === '7d') {
            return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:00`;
          } else {
            return `${date.getDate()}/${date.getMonth() + 1}`;
          }
        });
        
        const temperatureData = chartData.map((item) => item.temperature);
        const humidityData = chartData.map((item) => item.humidity);
        const lightData = chartData.map((item) => item.light);
        const soilData = chartData.map((item) => item.soil);
        
        setChartData({
          labels,
          datasets: [
            {
              label: 'Nhiệt độ (°C)',
              data: temperatureData,
              borderColor: '#FF6384',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.4,
              yAxisID: 'y',
            },
            {
              label: 'Độ ẩm không khí (%)',
              data: humidityData,
              borderColor: '#36A2EB',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              tension: 0.4,
              yAxisID: 'y',
            },
            {
              label: 'Ánh sáng (lux)',
              data: lightData,
              borderColor: '#FFCE56',
              backgroundColor: 'rgba(255, 206, 86, 0.2)',
              tension: 0.4,
              yAxisID: 'y1',
            },
            {
              label: 'Độ ẩm đất (%)',
              data: soilData,
              borderColor: '#4BC0C0',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4,
              yAxisID: 'y',
            },
          ],
        });
        
        setLastChartUpdate(new Date());
      } else {
        console.warn('Không có dữ liệu biểu đồ cho khoảng thời gian đã chọn');
        setChartData(null);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu biểu đồ:', err);
      toast.warning('Không thể tải dữ liệu biểu đồ');
    } finally {
      setChartLoading(false);
    }
  };

  // Làm mới dữ liệu
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Lấy dữ liệu cảm biến mới nhất
      const sensorResponse = await getLatestSensorData(id);
      setSensorData(sensorResponse.data);
      
      // Lấy trạng thái thiết bị
      const deviceResponse = await getDevicesStatus(id);
      setDeviceStatus({
        fan: deviceResponse.fan_status,
        light: deviceResponse.light_status,
        pump: deviceResponse.pump_status,
        auto: deviceResponse.auto_mode,
      });
      
      toast.success('Đã cập nhật dữ liệu mới nhất');
    } catch (err) {
      toast.error('Lỗi khi làm mới dữ liệu');
    } finally {
      setRefreshing(false);
    }
  };

  // Điều khiển thiết bị
  const handleDeviceControl = async (device, state) => {
    try {
      setControlLoading({ ...controlLoading, [device]: true });
      
      switch (device) {
        case 'fan':
          await controlDevice(id, 'FAN', state);
          break;
        case 'light':
          await controlDevice(id, 'LIGHT', state);
          break;
        case 'pump':
          await controlDevice(id, 'PUMP', state);
          break;
        case 'auto':
          await toggleAutoMode(id, state);
          break;
        case 'all':
          if (state) {
            await turnOnAllDevices(id);
          } else {
            await turnOffAllDevices(id);
          }
          break;
        default:
          throw new Error('Thiết bị không hợp lệ');
      }
      
      // Cập nhật trạng thái thiết bị
      setDeviceStatus({
        ...deviceStatus,
        [device]: state,
      });
      
      toast.success(`Đã ${state ? 'bật' : 'tắt'} ${getDeviceName(device)}`);
    } catch (err) {
      toast.error(err.message || `Lỗi khi điều khiển ${getDeviceName(device)}`);
    } finally {
      setControlLoading({ ...controlLoading, [device]: false });
    }
  };

  // Lấy tên thiết bị tiếng Việt
  const getDeviceName = (device) => {
    switch (device) {
      case 'fan': return 'quạt';
      case 'light': return 'đèn';
      case 'pump': return 'máy bơm';
      case 'auto': return 'chế độ tự động';
      case 'all': return 'tất cả thiết bị';
      default: return device;
    }
  };

  // Hiển thị chip trạng thái kết nối
  const getConnectionStatusChip = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Chip label="Đang kết nối" color="success" size="small" />;
      case 'recent':
        return <Chip label="Kết nối gần đây" color="warning" size="small" />;
      case 'disconnected':
        return <Chip label="Mất kết nối" color="error" size="small" />;
      case 'never':
        return <Chip label="Chưa kết nối" color="error" size="small" />;
      default:
        return <Chip label="Không xác định" color="default" size="small" />;
    }
  };

  // Hàm xử lý khi thay đổi khoảng thời gian
  const handleChartPeriodChange = (event) => {
    const newPeriod = event.target.value;
    setChartPeriod(newPeriod);
    fetchChartData(newPeriod);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {garden.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Trạng thái:
            </Typography>
            {getConnectionStatusChip()}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Kết nối lần cuối: {garden?.last_connected ? formatDateTime(garden.last_connected) : 'Chưa kết nối'}
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Làm mới dữ liệu">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            component={RouterLink}
            to={`/gardens/${id}/settings`}
            sx={{ ml: 1 }}
          >
            Cài đặt
          </Button>
          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            component={RouterLink}
            to={`/gardens/${id}/schedules`}
            sx={{ ml: 1 }}
          >
            Lịch trình
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Dữ liệu cảm biến */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Dữ liệu cảm biến
              </Typography>
              {!sensorData ? (
                <Alert severity="info">Chưa có dữ liệu cảm biến</Alert>
              ) : (
                <Grid container spacing={3}>
                  {/* Nhiệt độ */}
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ThermostatIcon color="error" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">Nhiệt độ</Typography>
                      </Box>
                      <Typography variant="h4" sx={{ my: 1 }}>
                        {sensorData.temperature}°C
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(sensorData.temperature / 50) * 100} 
                        color="error"
                      />
                    </Paper>
                  </Grid>
                  
                  {/* Độ ẩm không khí */}
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <WaterDropIcon color="info" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">Độ ẩm không khí</Typography>
                      </Box>
                      <Typography variant="h4" sx={{ my: 1 }}>
                        {sensorData.humidity}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={sensorData.humidity} 
                        color="info"
                      />
                    </Paper>
                  </Grid>
                  
                  {/* Ánh sáng */}
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SunIcon color="warning" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">Ánh sáng</Typography>
                      </Box>
                      <Typography variant="h4" sx={{ my: 1 }}>
                        {sensorData.light}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={sensorData.light} 
                        color="warning"
                      />
                    </Paper>
                  </Grid>
                  
                  {/* Độ ẩm đất */}
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <GrassIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">Độ ẩm đất</Typography>
                      </Box>
                      <Typography variant="h4" sx={{ my: 1 }}>
                        {sensorData.soil}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={sensorData.soil} 
                        color="success"
                      />
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Điều khiển thiết bị */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Điều khiển thiết bị
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={deviceStatus.auto}
                      onChange={(e) => handleDeviceControl('auto', e.target.checked)}
                      disabled={controlLoading.auto || connectionStatus === 'disconnected' || connectionStatus === 'never'}
                    />
                  }
                  label="Chế độ tự động"
                />
              </Box>
              
              {connectionStatus === 'disconnected' || connectionStatus === 'never' ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Thiết bị đang mất kết nối. Điều khiển thiết bị có thể không hoạt động.
                </Alert>
              ) : null}
              
              <Grid container spacing={2}>
                {/* Quạt */}
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <FanIcon sx={{ fontSize: 40, color: deviceStatus.fan ? 'primary.main' : 'text.secondary' }} />
                    <Typography variant="h6">Quạt</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {deviceStatus.fan ? 'Đang bật' : 'Đang tắt'}
                    </Typography>
                    <Button
                      variant={deviceStatus.fan ? 'contained' : 'outlined'}
                      color={deviceStatus.fan ? 'primary' : 'inherit'}
                      onClick={() => handleDeviceControl('fan', !deviceStatus.fan)}
                      disabled={controlLoading.fan || deviceStatus.auto || connectionStatus === 'disconnected' || connectionStatus === 'never'}
                      fullWidth
                    >
                      {controlLoading.fan ? (
                        <CircularProgress size={24} />
                      ) : deviceStatus.fan ? (
                        'Tắt quạt'
                      ) : (
                        'Bật quạt'
                      )}
                    </Button>
                  </Paper>
                </Grid>
                
                {/* Đèn */}
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <LightIcon sx={{ fontSize: 40, color: deviceStatus.light ? 'warning.main' : 'text.secondary' }} />
                    <Typography variant="h6">Đèn</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {deviceStatus.light ? 'Đang bật' : 'Đang tắt'}
                    </Typography>
                    <Button
                      variant={deviceStatus.light ? 'contained' : 'outlined'}
                      color={deviceStatus.light ? 'warning' : 'inherit'}
                      onClick={() => handleDeviceControl('light', !deviceStatus.light)}
                      disabled={controlLoading.light || deviceStatus.auto || connectionStatus === 'disconnected' || connectionStatus === 'never'}
                      fullWidth
                    >
                      {controlLoading.light ? (
                        <CircularProgress size={24} />
                      ) : deviceStatus.light ? (
                        'Tắt đèn'
                      ) : (
                        'Bật đèn'
                      )}
                    </Button>
                  </Paper>
                </Grid>
                
                {/* Máy bơm */}
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <PumpIcon sx={{ fontSize: 40, color: deviceStatus.pump ? 'info.main' : 'text.secondary' }} />
                    <Typography variant="h6">Máy bơm</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {deviceStatus.pump ? 'Đang bật' : 'Đang tắt'}
                    </Typography>
                    <Button
                      variant={deviceStatus.pump ? 'contained' : 'outlined'}
                      color={deviceStatus.pump ? 'info' : 'inherit'}
                      onClick={() => handleDeviceControl('pump', !deviceStatus.pump)}
                      disabled={controlLoading.pump || deviceStatus.auto || connectionStatus === 'disconnected' || connectionStatus === 'never'}
                      fullWidth
                    >
                      {controlLoading.pump ? (
                        <CircularProgress size={24} />
                      ) : deviceStatus.pump ? (
                        'Tắt máy bơm'
                      ) : (
                        'Bật máy bơm'
                      )}
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<PowerIcon />}
                  onClick={() => handleDeviceControl('all', true)}
                  disabled={controlLoading.all || deviceStatus.auto || connectionStatus === 'disconnected' || connectionStatus === 'never'}
                >
                  {controlLoading.all ? <CircularProgress size={24} /> : 'Bật tất cả'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<PowerIcon />}
                  onClick={() => handleDeviceControl('all', false)}
                  disabled={controlLoading.all || deviceStatus.auto || connectionStatus === 'disconnected' || connectionStatus === 'never'}
                >
                  {controlLoading.all ? <CircularProgress size={24} /> : 'Tắt tất cả'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Biểu đồ */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Biểu đồ phân tích dữ liệu
                </Typography>
                <FormControl sx={{ minWidth: 150 }}>
                  <Select
                    value={chartPeriod}
                    onChange={handleChartPeriodChange}
                    size="small"
                    displayEmpty
                    inputProps={{ 'aria-label': 'Chọn khoảng thời gian' }}
                  >
                    <MenuItem value="24h">24 giờ qua</MenuItem>
                    <MenuItem value="7d">7 ngày qua</MenuItem>
                    <MenuItem value="30d">30 ngày qua</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {chartLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : chartData ? (
                <Box sx={{ height: 400 }}>
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Dữ liệu cảm biến theo thời gian',
                        },
                      },
                    }}
                  />
                </Box>
              ) : (
                <Alert severity="info">Không có đủ dữ liệu để hiển thị biểu đồ</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GardenDetail; 