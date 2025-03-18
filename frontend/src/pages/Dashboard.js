import React, { useState, useEffect, useCallback } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  useTheme,
  Avatar,
  Badge,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Yard as YardIcon,
  Add as AddIcon,
  Thermostat as ThermostatIcon,
  WaterDrop as WaterDropIcon,
  WbSunny as SunIcon,
  Grass as GrassIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  Air as FanIcon,
  Opacity as PumpIcon,
  Lightbulb as LightIcon,
  Notifications as NotificationIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  Settings as SettingsIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon,
  Devices as DevicesIcon,
  DeviceUnknown as DeviceUnknownIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Recommend as RecommendIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  EmojiObjects as EmojiObjectsIcon,
  Science as ScienceIcon,
  BarChart as ChartIcon,
  PlayArrow as PlayArrowIcon,
  ErrorOutline as ErrorOutlineIcon,
  Timeline as TimelineIcon,
  Fireplace as FireplaceIcon,
  WaterOutlined as WaterOutlinedIcon,
} from '@mui/icons-material';
import {
  Bar,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartJSTooltip,
  Legend as ChartLegend,
} from 'chart.js';
import { Line as ChartLine, Bar as ChartBar } from 'react-chartjs-2';
import { getGardens, getLatestSensorData, getSensorDataHistory } from '../services/gardenService';
import { getDevicesStatus, controlDevice, toggleAutoMode } from '../services/deviceService';
import { toast } from 'react-toastify';
import socketService from '../services/socketService';
import { getAnalysisReports, getAnalysisDetail } from '../services/analysisService';

// Đăng ký các thành phần chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartJSTooltip,
  ChartLegend
);

const Dashboard = () => {
  // State chung
  const [gardens, setGardens] = useState([]);
  const [selectedGardenId, setSelectedGardenId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  
  // State cho dữ liệu cảm biến
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    light: 0,
    soil: 0,
    timestamp: null,
  });
  
  // State cho thiết bị
  const [deviceStatus, setDeviceStatus] = useState({
    fan: false,
    light: false,
    pump: false,
    auto: false,
  });
  const [controlLoading, setControlLoading] = useState({
    fan: false,
    light: false,
    pump: false,
    auto: false,
  });
  
  // State cho biểu đồ
  const [chartType, setChartType] = useState('line');
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('24h');
  const [lastChartUpdate, setLastChartUpdate] = useState(null);
  
  // State cho thông báo
  const [notifications, setNotifications] = useState([]);
  
  // State cho trạng thái kết nối
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // State cho trạng thái tưới nước
  const [isWatering, setIsWatering] = useState(false);
  
  // State cho phân tích
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  // Tải danh sách vườn khi trang được tải
  useEffect(() => {
    fetchGardens();
  }, []);
  
  // Lấy dữ liệu khi chọn vườn
  useEffect(() => {
    if (selectedGardenId) {
      const fetchData = async () => {
        try {
          await fetchSensorData();
          await fetchDeviceStatus();
          await fetchChartData(chartPeriod);
          await fetchLatestAnalysis(selectedGardenId);
        } catch (err) {
          console.error('Lỗi khi tải dữ liệu vườn:', err);
        }
      };
      
      fetchData();
      
      // Thiết lập interval để cập nhật dữ liệu mỗi 30 giây
      const intervalId = setInterval(() => {
      fetchSensorData();
      fetchDeviceStatus();
        fetchChartData(chartPeriod); // Thêm cập nhật biểu đồ
        console.log('Đã tự động cập nhật dữ liệu');
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [selectedGardenId, chartPeriod]);

  // Thiết lập Socket.IO khi component mount
  useEffect(() => {
    if (selectedGardenId) {
      console.log('Dashboard - Kết nối Socket.IO cho vườn:', selectedGardenId);
      socketService.initializeSocket();
      socketService.joinGardenRoom(selectedGardenId);
      
      // Lắng nghe cập nhật trạng thái thiết bị từ Wemos
      socketService.onDeviceStatusUpdate((data) => {
        if (data.gardenId === selectedGardenId || data.garden_id === selectedGardenId) {
          console.log('Dashboard - Nhận trạng thái thiết bị mới qua Socket.IO:', data);
          const newStatus = {
            fan: data.deviceStatus?.fan || data.fan_status || false,
            light: data.deviceStatus?.light || data.light_status || false,
            pump: data.deviceStatus?.pump || data.pump_status || false,
            auto: data.deviceStatus?.auto || data.auto_mode || false
          };
          setDeviceStatus(newStatus);
          console.log('Dashboard - Đã cập nhật trạng thái thiết bị:', newStatus);
        }
      });
      
      // Lắng nghe cập nhật dữ liệu cảm biến
      socketService.onSensorDataUpdate((data) => {
        if (data.gardenId === selectedGardenId || data.garden_id === selectedGardenId) {
          console.log('Dashboard - Nhận dữ liệu cảm biến mới qua Socket.IO:', data);
          fetchSensorData();
        }
      });
      
      return () => {
        console.log('Dashboard - Ngắt kết nối Socket.IO cho vườn:', selectedGardenId);
        socketService.leaveGardenRoom(selectedGardenId);
      };
    }
  }, [selectedGardenId]);

  // Lấy danh sách vườn
  const fetchGardens = async () => {
    try {
      setLoading(true);
      console.log('Dashboard - Đang gọi API getGardens');
      const response = await getGardens();
      console.log('Dashboard - Phản hồi từ API:', response);
      
      const gardenList = response.gardens || [];
      if (gardenList.length > 0) {
        setGardens(gardenList);
        // Tự động chọn vườn đầu tiên
        setSelectedGardenId(gardenList[0].id);
        
        // Thêm thông báo
        addNotification('Đã tải danh sách vườn thành công', 'info');
      } else {
        addNotification('Không có vườn nào được tìm thấy', 'warning');
      }
      
      setError(null);
    } catch (err) {
      console.error('Dashboard - Lỗi khi lấy danh sách vườn:', err);
      setError(err.message || 'Lỗi khi tải danh sách vườn');
      addNotification('Lỗi khi tải danh sách vườn', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Lấy dữ liệu cảm biến mới nhất
  const fetchSensorData = async () => {
    if (!selectedGardenId) return;
    
    try {
      console.log(`Dashboard - Đang lấy dữ liệu cảm biến cho vườn: ${selectedGardenId}`);
      const response = await getLatestSensorData(selectedGardenId);
      
      if (response.data && response.data.data) {
        setSensorData(response.data.data);
        
        // Cập nhật trạng thái kết nối
        const timestamp = new Date(response.data.data.timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));
        
        if (diffMinutes < 5) {
          setConnectionStatus('connected');
        } else if (diffMinutes < 30) {
          setConnectionStatus('inactive');
        } else {
          setConnectionStatus('disconnected');
        }
      }
    } catch (err) {
      console.error(`Dashboard - Lỗi khi lấy dữ liệu cảm biến:`, err);
      addNotification('Lỗi khi lấy dữ liệu cảm biến', 'error');
    }
  };
  
  // Lấy trạng thái thiết bị
  const fetchDeviceStatus = async () => {
    if (!selectedGardenId) return;
    
    try {
      console.log(`Dashboard - Đang lấy trạng thái thiết bị cho vườn: ${selectedGardenId}`);
      const response = await getDevicesStatus(selectedGardenId);
      
      setDeviceStatus({
        fan: response.fan_status,
        light: response.light_status,
        pump: response.pump_status,
        auto: response.auto_mode,
      });
    } catch (err) {
      console.error(`Dashboard - Lỗi khi lấy trạng thái thiết bị:`, err);
      addNotification('Lỗi khi lấy trạng thái thiết bị', 'error');
    }
  };
  
  // Lấy dữ liệu biểu đồ
  const fetchChartData = async (period = chartPeriod) => {
    if (!selectedGardenId) return;
    
    try {
      setChartLoading(true);
      
      // Chuyển đổi period thành tham số API
      let duration;
      switch(period) {
        case '12h':
          duration = '12h';
          break;
        case '24h':
          duration = '24h';
          break;
        case '7d':
          duration = '7d';
          break;
        default:
          duration = '24h';
      }
      
      console.log(`Đang lấy dữ liệu biểu đồ với khoảng thời gian: ${period} (${duration})`);
      const response = await getSensorDataHistory(selectedGardenId, { duration });
      console.log('Dữ liệu biểu đồ nhận được từ backend:', response);
      
      // Kiểm tra cấu trúc dữ liệu trả về
      let sensorData = [];
      
      if (response.success && response.data) {
        sensorData = response.data;
      } else if (response.data) {
        sensorData = response.data;
      } else if (Array.isArray(response)) {
        sensorData = response;
      }
      
      console.log(`Dữ liệu cảm biến đã xử lý: ${sensorData.length} điểm dữ liệu`);
      
      if (sensorData && sensorData.length > 0) {
        // Sắp xếp dữ liệu theo thời gian tăng dần
        sensorData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Lấy thời gian cập nhật gần nhất
        const latestTimestamp = new Date(sensorData[sensorData.length - 1].timestamp);
        setLastChartUpdate(latestTimestamp);
        
        // Kiểm tra xem dữ liệu có cập nhật không
        const now = new Date();
        const timeSinceLastData = (now - latestTimestamp) / (1000 * 60); // Số phút
        
        if (timeSinceLastData > 60) {
          console.warn(`Cảnh báo: Dữ liệu biểu đồ không được cập nhật trong ${Math.floor(timeSinceLastData)} phút qua!`);
          toast.warning(`Dữ liệu biểu đồ không được cập nhật trong ${Math.floor(timeSinceLastData)} phút qua. Có thể có vấn đề với việc lưu trữ dữ liệu.`);
        }
        
        // Lấy mẫu dữ liệu để tránh quá nhiều điểm trên biểu đồ
        let sampledData = sensorData;
        if (period === '7d' && sensorData.length > 168) { // Nếu nhiều hơn 168 điểm (7 ngày x 24 giờ)
          const sampleRate = Math.floor(sensorData.length / 168);
          sampledData = sensorData.filter((_, index) => index % sampleRate === 0);
          console.log(`Lấy mẫu dữ liệu từ ${sensorData.length} xuống ${sampledData.length} điểm`);
        } else if (period === '24h' && sensorData.length > 48) { // Nếu nhiều hơn 48 điểm (24 giờ x 2 điểm/giờ)
          const sampleRate = Math.floor(sensorData.length / 48);
          sampledData = sensorData.filter((_, index) => index % sampleRate === 0);
          console.log(`Lấy mẫu dữ liệu từ ${sensorData.length} xuống ${sampledData.length} điểm`);
        }
        
        const labels = sampledData.map((item) => {
          const date = new Date(item.timestamp);
          if (period === '12h') {
            // Format: 15:30
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          } else if (period === '24h') {
            // Format: 15:00
            return `${date.getHours().toString().padStart(2, '0')}:00`;
          } else if (period === '7d') {
            // Format: 15/05
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          }
          return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        });
        
        const temperatureData = sampledData.map((item) => item.temperature);
        const humidityData = sampledData.map((item) => item.humidity);
        const lightData = sampledData.map((item) => item.light);
        const soilData = sampledData.map((item) => item.soil);
        
        const chartDataObj = {
          labels,
          datasets: [
            {
              label: 'Nhiệt độ (°C)',
              data: temperatureData,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              tension: 0.3,
              borderWidth: 2,
              pointRadius: period === '7d' ? 1 : 3,
              pointHoverRadius: 5
            },
            {
              label: 'Độ ẩm không khí (%)',
              data: humidityData,
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              tension: 0.3,
              borderWidth: 2,
              pointRadius: period === '7d' ? 1 : 3,
              pointHoverRadius: 5
            },
            {
              label: 'Ánh sáng (%)',
              data: lightData,
              borderColor: 'rgb(255, 206, 86)',
              backgroundColor: 'rgba(255, 206, 86, 0.5)',
              tension: 0.3,
              borderWidth: 2,
              pointRadius: period === '7d' ? 1 : 3,
              pointHoverRadius: 5
            },
            {
              label: 'Độ ẩm đất (%)',
              data: soilData,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              tension: 0.3,
              borderWidth: 2,
              pointRadius: period === '7d' ? 1 : 3,
              pointHoverRadius: 5
            },
          ],
          // Thêm dữ liệu gốc để tham chiếu
          _rawData: {
            count: sensorData.length,
            firstTimestamp: sensorData[0].timestamp,
            lastTimestamp: sensorData[sensorData.length - 1].timestamp
          }
        };
        
        console.log('Dữ liệu biểu đồ đã xử lý:', chartDataObj);
        setChartData(chartDataObj);
      } else {
        console.warn('Không có dữ liệu biểu đồ từ backend hoặc dữ liệu không đúng định dạng');
        setChartData(null);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu biểu đồ:', err);
      toast.error(`Lỗi khi tải dữ liệu biểu đồ: ${err.message || 'Không xác định'}`);
      setChartData(null);
    } finally {
      setChartLoading(false);
    }
  };
  
  // Điều khiển thiết bị
  const handleControlDevice = async (device, state) => {
    if (!selectedGardenId) return;
    
    try {
      setControlLoading(prev => ({ ...prev, [device]: true }));
      console.log(`Dashboard - Đang điều khiển thiết bị: ${device} -> ${state ? 'BẬT' : 'TẮT'}`);
      
      const response = await controlDevice(selectedGardenId, device, state);
      
      if (response.success) {
        setDeviceStatus(prev => ({
          ...prev,
          [device.toLowerCase()]: state,
        }));
        
        toast.success(`Đã ${state ? 'bật' : 'tắt'} ${getDeviceName(device)}`);
        addNotification(`Đã ${state ? 'bật' : 'tắt'} ${getDeviceName(device)}`, 'success');
      }
    } catch (err) {
      console.error(`Dashboard - Lỗi khi điều khiển thiết bị:`, err);
      toast.error(`Lỗi khi ${state ? 'bật' : 'tắt'} ${getDeviceName(device)}`);
      addNotification(`Lỗi khi điều khiển ${getDeviceName(device)}`, 'error');
    } finally {
      setControlLoading(prev => ({ ...prev, [device]: false }));
    }
  };
  
  // Bật/tắt chế độ tự động
  const handleToggleAutoMode = async () => {
    try {
      // Cập nhật trạng thái loading
      setControlLoading(prev => ({ ...prev, auto: true }));
      console.log(`Dashboard - Đang ${deviceStatus.auto ? 'tắt' : 'bật'} chế độ tự động`);
      
      // Gọi API điều khiển
      const response = await toggleAutoMode(selectedGardenId, !deviceStatus.auto);
      
      if (response.success) {
        // Cập nhật trạng thái mới
        setDeviceStatus(prev => ({
          ...prev,
          auto: !prev.auto,
        }));
        
        // Hiển thị thông báo thành công
        toast.success(`Đã ${!deviceStatus.auto ? 'kích hoạt' : 'vô hiệu hóa'} lịch trình tự động`);
        addNotification(`Đã ${!deviceStatus.auto ? 'kích hoạt' : 'vô hiệu hóa'} lịch trình tự động`, 'success');
        
        // Thông báo về trạng thái lịch trình
        if (!deviceStatus.auto) {
          toast.info('Các lịch trình sẽ được thực thi theo thời gian đã cài đặt');
          addNotification('Các lịch trình sẽ được thực thi theo thời gian đã cài đặt', 'info');
        } else {
          toast.info('Các lịch trình đã bị vô hiệu hóa và sẽ không được thực thi');
          addNotification('Các lịch trình đã bị vô hiệu hóa', 'info');
        }
      } else {
        toast.error(`Lỗi khi ${!deviceStatus.auto ? 'bật' : 'tắt'} chế độ tự động`);
      }
    } catch (error) {
      console.error('Lỗi khi điều khiển chế độ tự động:', error);
      setControlLoading(prev => ({ ...prev, auto: false }));
    }
  };
  
  // Thêm thông báo mới
  const addNotification = (message, severity = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      severity,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, newNotification]);
    
    // Tự động xóa thông báo sau 5 giây
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };
  
  // Lấy tên thiết bị
  const getDeviceName = (device) => {
    switch (device.toLowerCase()) {
      case 'fan': return 'quạt';
      case 'light': return 'đèn';
      case 'pump': return 'máy bơm';
      default: return device;
    }
  };
  
  // Xử lý thay đổi loại biểu đồ
  const handleChangeChartType = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  // Xử lý thay đổi khoảng thời gian biểu đồ
  const handleChartPeriodChange = (event, newPeriod) => {
    if (newPeriod !== null && newPeriod !== chartPeriod) {
      console.log(`Đang chuyển đổi khoảng thời gian biểu đồ từ ${chartPeriod} sang ${newPeriod}`);
      setChartPeriod(newPeriod);
      toast.info(`Đang tải dữ liệu cho khoảng thời gian ${newPeriod}...`);
      fetchChartData(newPeriod);
    }
  };
  
  // Định dạng thời gian
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  // Làm mới tất cả dữ liệu
  const refreshAllData = () => {
    fetchSensorData();
    fetchDeviceStatus();
    fetchChartData();
    addNotification('Đã làm mới dữ liệu', 'info');
  };

  // Lấy biểu tượng cho loại thông báo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error': return <WarningIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'success': return <CheckIcon color="success" />;
      case 'info': 
      default: return <InfoIcon color="info" />;
    }
  };
  
  // Lấy màu cho chip trạng thái kết nối
  const getConnectionStatusColor = (garden) => {
    if (!garden || !garden.last_connected) return 'default';
    
    const lastConnected = new Date(garden.last_connected);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastConnected) / (1000 * 60));
    
    if (diffMinutes < 5) return 'success';
    if (diffMinutes < 30) return 'warning';
    return 'error';
  };
  
  // Lấy text trạng thái kết nối
  const getConnectionStatusText = (garden) => {
    if (!garden || !garden.last_connected) return 'Chưa kết nối';
    
    const lastConnected = new Date(garden.last_connected);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastConnected) / (1000 * 60));
    
    if (diffMinutes < 5) return 'Đang kết nối';
    if (diffMinutes < 30) return 'Gần đây';
    return 'Mất kết nối';
  };

  // Tạo options cho biểu đồ
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Dữ liệu cảm biến trong 24 giờ qua',
      },
    },
  };

  // Trong component Dashboard, thêm hàm kiểm tra dữ liệu cũ
  const isDataOutdated = () => {
    if (!sensorData.timestamp) return true;
    
    const timestamp = new Date(sensorData.timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    return diffMinutes >= 5; // Dữ liệu quá 5 phút được coi là cũ
  };

  // Trong component Dashboard, thêm hàm lấy opacity dựa trên trạng thái kết nối
  const getDataOpacity = () => {
    switch (connectionStatus) {
      case 'connected': return 1;
      case 'inactive': return 0.7;
      case 'disconnected': return 0.5;
      default: return 0.5;
    }
  };

  // Lấy màu cho timestamp dựa trên trạng thái kết nối
  const getTimestampColor = () => {
    if (connectionStatus === 'connected') {
      return 'text.secondary';
    } else if (connectionStatus === 'inactive') {
      return theme.palette.warning.main;
    } else {
      return theme.palette.error.main;
    }
  };

  // Xử lý khi thay đổi vườn
  const handleGardenChange = (event) => {
    setSelectedGardenId(event.target.value);
  };

  // Hàm xử lý tưới nước thủ công
  const handleWaterGarden = async (gardenId) => {
    if (!gardenId) return;
    
    try {
      setIsWatering(true);
      addNotification('Đang tưới nước...', 'info');
      
      // Gọi API để bật máy bơm
      await handleControlDevice('PUMP', true);
      
      // Tự động tắt máy bơm sau 10 giây
      setTimeout(async () => {
        await handleControlDevice('PUMP', false);
        addNotification('Đã hoàn thành tưới nước', 'success');
        setIsWatering(false);
      }, 10000);
    } catch (error) {
      console.error('Lỗi khi tưới nước:', error);
      addNotification('Lỗi khi tưới nước: ' + (error.message || 'Đã xảy ra lỗi'), 'error');
      setIsWatering(false);
    }
  };

  // Hàm lấy báo cáo phân tích mới nhất
  const fetchLatestAnalysis = useCallback(async (gardenId) => {
    if (!gardenId) return;
    
    try {
      setAnalysisLoading(true);
      setAnalysisError(null);
      
      // Lấy danh sách phân tích, chỉ lấy 1 kết quả mới nhất
      const response = await getAnalysisReports(gardenId, { page: 1, limit: 1 });
      
      if (response.success && response.data?.reports && response.data.reports.length > 0) {
        // Có báo cáo phân tích
        const latestReportId = response.data.reports[0]._id;
        
        // Lấy chi tiết báo cáo mới nhất
        const detailResponse = await getAnalysisDetail(gardenId, latestReportId);
        
        if (detailResponse.success) {
          const reportData = detailResponse.report || detailResponse.data?.report;
          setLatestAnalysis(reportData);
        } else {
          console.error('Lỗi khi lấy chi tiết báo cáo phân tích:', detailResponse);
          setAnalysisError('Không thể tải chi tiết báo cáo phân tích');
        }
      } else {
        // Không có báo cáo phân tích
        setLatestAnalysis(null);
      }
    } catch (error) {
      console.error('Lỗi khi lấy báo cáo phân tích mới nhất:', error);
      setAnalysisError('Đã xảy ra lỗi khi tải phân tích');
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  // Thêm vào useEffect để gọi fetchLatestAnalysis khi selectedGardenId thay đổi
  useEffect(() => {
    if (selectedGardenId) {
      fetchLatestAnalysis(selectedGardenId);
    }
  }, [selectedGardenId, fetchLatestAnalysis]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box 
        sx={{ 
          mb: 5, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          justifyContent: 'space-between',
          animation: 'fadeIn 0.5s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
          },
        }}
      >
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              color: theme.palette.primary.main,
              position: 'relative',
              letterSpacing: '-0.01em',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 60,
                height: 3,
                background: 'linear-gradient(to right, #1E88E5, #64B5F6)',
                borderRadius: 4
              }
            }}
          >
          Bảng điều khiển
        </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{ 
              mt: 2,
              maxWidth: '600px',
              lineHeight: 1.6
            }}
          >
            Quản lý và theo dõi vườn thông minh của bạn. Xem các chỉ số môi trường và điều khiển thiết bị từ xa.
          </Typography>
        </Box>
        
        <Box sx={{ mt: { xs: 3, sm: 0 }, display: 'flex', alignItems: 'center' }}>
          <FormControl fullWidth>
            <Select
              value={selectedGardenId}
              onChange={handleGardenChange}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <Typography>Chọn vườn</Typography>;
                }
                
                const selectedGarden = gardens.find(g => g.id === selected);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography>{selectedGarden?.name}</Typography>
                    {selectedGarden && (
                      <Chip 
                        label={getConnectionStatusText(selectedGarden)} 
                        size="small" 
                        color={getConnectionStatusColor(selectedGarden)}
                        sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                  </Box>
                );
              }}
            >
              <MenuItem disabled value="">
                <Typography>Chọn vườn</Typography>
              </MenuItem>
              {gardens.map((garden) => (
                <MenuItem key={garden.id} value={garden.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography>{garden.name}</Typography>
                    <Chip 
                      label={getConnectionStatusText(garden)} 
                      size="small" 
                      color={getConnectionStatusColor(garden)}
                      sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <IconButton 
            onClick={refreshAllData} 
            color="primary"
            sx={{ 
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              width: 48,
              height: 48,
              '&:hover': {
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transform: 'rotate(30deg)'
              }
            }}
            aria-label="Làm mới dữ liệu"
            title="Làm mới dữ liệu"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Dữ liệu cảm biến */}
      <Box sx={{ mb: 5 }}>
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            mb: 3, 
            fontWeight: 600,
            color: theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
            '&::before': {
              content: '""',
              display: 'inline-block',
              width: 18,
              height: 18,
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.light,
              marginRight: 1.5,
            }
          }}
        >
          Chỉ số môi trường
            </Typography>
        
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Nhiệt độ */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                height: '100%',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  transform: { xs: 'none', sm: 'translateY(-4px)' },
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                },
                opacity: getDataOpacity(),
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(244, 67, 54, 0.08)',
                      mr: 2
                    }}
                  >
                    <ThermostatIcon 
                      sx={{ 
                        color: '#F44336', 
                        fontSize: { xs: 24, sm: 28 },
                        animation: sensorData.temperature > 30 ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.2)' },
                          '100%': { transform: 'scale(1)' },
                        }
                      }} 
                    />
                  </Box>
                  <Box>
            <Typography 
              variant="body2" 
              sx={{ 
                        color: 'text.secondary',
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Nhiệt độ
                    </Typography>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1.5rem', sm: '2rem' }
                      }}
                    >
                      {sensorData.temperature}<span style={{ fontSize: '1rem' }}>°C</span>
                  </Typography>
                  </Box>
                </Box>
                
                {/* Status indicator */}
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={
                      sensorData.temperature > 30 
                        ? "Cao" 
                        : sensorData.temperature < 15 
                          ? "Thấp" 
                          : "Bình thường"
                    }
                    size="small"
                    color={
                      sensorData.temperature > 30 
                        ? "error" 
                        : sensorData.temperature < 15 
                          ? "info" 
                          : "success"
                    }
                    sx={{ 
                      height: { xs: 24, sm: 28 },
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  />
                    <Typography 
                      variant="caption" 
                    display="block" 
                      sx={{ 
                      mt: 1, 
                      color: getTimestampColor(),
                      fontSize: { xs: '0.65rem', sm: '0.7rem' }
                      }}
                    >
                    Cập nhật: {formatTime(sensorData.timestamp)}
                    </Typography>
                </Box>
                </CardContent>
              </Card>
            </Grid>
            
          {/* Độ ẩm không khí */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                height: '100%',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  transform: { xs: 'none', sm: 'translateY(-4px)' },
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                },
                opacity: getDataOpacity(),
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(33, 150, 243, 0.08)',
                      mr: 2
                    }}
                  >
                    <WaterDropIcon 
                      sx={{ 
                        color: '#2196F3', 
                        fontSize: { xs: 24, sm: 28 },
                      }} 
                    />
                  </Box>
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Độ ẩm không khí
                    </Typography>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1.5rem', sm: '2rem' }
                      }}
                    >
                      {sensorData.humidity}<span style={{ fontSize: '1rem' }}>%</span>
                  </Typography>
                  </Box>
                </Box>
                
                {/* Status indicator */}
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={
                      sensorData.humidity < 40 
                        ? "Thấp" 
                        : sensorData.humidity > 70 
                          ? "Cao" 
                          : "Bình thường"
                    }
                    size="small"
                    color={
                      sensorData.humidity < 40 
                        ? "warning" 
                        : sensorData.humidity > 70 
                          ? "info" 
                          : "success"
                    }
                    sx={{ 
                      height: { xs: 24, sm: 28 },
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  />
                    <Typography 
                      variant="caption" 
                    display="block" 
                      sx={{ 
                      mt: 1, 
                      color: getTimestampColor(),
                      fontSize: { xs: '0.65rem', sm: '0.7rem' }
                      }}
                    >
                    Cập nhật: {formatTime(sensorData.timestamp)}
                    </Typography>
                </Box>
                </CardContent>
              </Card>
            </Grid>
            
          {/* Ánh sáng */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                height: '100%',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  transform: { xs: 'none', sm: 'translateY(-4px)' },
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                },
                opacity: getDataOpacity(),
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 193, 7, 0.08)',
                      mr: 2
                    }}
                  >
                    <SunIcon 
                      sx={{ 
                        color: '#FFC107', 
                        fontSize: { xs: 24, sm: 28 },
                      }} 
                    />
                  </Box>
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Ánh sáng
                    </Typography>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1.5rem', sm: '2rem' }
                      }}
                    >
                      {sensorData.light}<span style={{ fontSize: '1rem' }}>%</span>
                  </Typography>
                  </Box>
                </Box>
                
                {/* Status indicator */}
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={
                      sensorData.light < 20 
                        ? "Thấp" 
                        : sensorData.light > 80 
                          ? "Cao" 
                          : "Bình thường"
                    }
                    size="small"
                    color={
                      sensorData.light < 20 
                        ? "warning" 
                        : sensorData.light > 80 
                          ? "info" 
                          : "success"
                    }
                    sx={{ 
                      height: { xs: 24, sm: 28 },
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  />
                    <Typography 
                      variant="caption" 
                    display="block" 
                      sx={{ 
                      mt: 1, 
                      color: getTimestampColor(),
                      fontSize: { xs: '0.65rem', sm: '0.7rem' }
                      }}
                    >
                    Cập nhật: {formatTime(sensorData.timestamp)}
                    </Typography>
                </Box>
                </CardContent>
              </Card>
            </Grid>
            
          {/* Độ ẩm đất */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                height: '100%',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  transform: { xs: 'none', sm: 'translateY(-4px)' },
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                },
                opacity: getDataOpacity(),
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      mr: 2
                    }}
                  >
                    <GrassIcon 
                      sx={{ 
                        color: '#4CAF50', 
                        fontSize: { xs: 24, sm: 28 },
                      }} 
                    />
                  </Box>
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Độ ẩm đất
                    </Typography>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1.5rem', sm: '2rem' }
                      }}
                    >
                      {sensorData.soil}<span style={{ fontSize: '1rem' }}>%</span>
                  </Typography>
                  </Box>
                </Box>
                
                {/* Status indicator */}
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={
                      sensorData.soil < 30 
                        ? "Khô" 
                        : sensorData.soil > 70 
                          ? "Ẩm ướt" 
                          : "Bình thường"
                    }
                    size="small"
                    color={
                      sensorData.soil < 30 
                        ? "warning" 
                        : sensorData.soil > 70 
                          ? "info" 
                          : "success"
                    }
                    sx={{ 
                      height: { xs: 24, sm: 28 },
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  />
                    <Typography 
                      variant="caption" 
                    display="block" 
                      sx={{ 
                      mt: 1, 
                      color: getTimestampColor(),
                      fontSize: { xs: '0.65rem', sm: '0.7rem' }
                      }}
                    >
                    Cập nhật: {formatTime(sensorData.timestamp)}
                    </Typography>
                </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
      </Box>
          
      {/* Biểu đồ và điều khiển thiết bị */}
      <Grid container spacing={4} sx={{ mb: 5 }}>
        {/* Biểu đồ */}
            <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              borderRadius: 2, 
              overflow: 'hidden',
              height: '100%',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              mb: 5
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: { xs: 2, sm: 0 } }}>
                  Biểu đồ dữ liệu
                    </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 2 }, width: { xs: '100%', sm: 'auto' } }}>
                    <ToggleButtonGroup
                      value={chartType}
                      exclusive
                      onChange={handleChangeChartType}
                      size="small"
                    sx={{ display: 'flex', flexWrap: 'wrap' }}
                  >
                    <ToggleButton value="line" sx={{ px: { xs: 1, sm: 2 } }}>
                      <LineChartIcon fontSize="small" sx={{ mr: { xs: 0.5, sm: 1 } }} /> 
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Line</Box>
                      </ToggleButton>
                    <ToggleButton value="bar" sx={{ px: { xs: 1, sm: 2 } }}>
                      <BarChartIcon fontSize="small" sx={{ mr: { xs: 0.5, sm: 1 } }} /> 
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Bar</Box>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  
                  <ToggleButtonGroup
                    value={chartPeriod}
                    exclusive
                    onChange={handleChartPeriodChange}
                    size="small"
                    sx={{ display: 'flex', flexWrap: 'wrap' }}
                  >
                    <ToggleButton value="24h" sx={{ px: { xs: 1, sm: 2 } }}>24H</ToggleButton>
                    <ToggleButton value="7d" sx={{ px: { xs: 1, sm: 2 } }}>7D</ToggleButton>
                    <ToggleButton value="30d" sx={{ px: { xs: 1, sm: 2 } }}>30D</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
                  </Box>
                  
              <Box sx={{ height: { xs: 250, sm: 300, md: 400 }, position: 'relative' }}>
                  {chartLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress size={40} sx={{ color: theme.palette.primary.main }} />
                    </Box>
                ) : !chartData || !chartData.datasets || chartData.datasets.length < 4 ? (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      opacity: 0.7
                    }}
                  >
                    <DeviceUnknownIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Không có dữ liệu cảm biến
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                      Hãy đảm bảo thiết bị của bạn đang hoạt động và kết nối
                      </Typography>
                    </Box>
                  ) : (
                  <Box 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      p: 2,
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: 2,
                      bgcolor: 'background.paper'
                    }}
                  >
                      {chartType === 'line' ? (
                      <ChartLine
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                              labels: {
                                font: {
                                  size: 12
                                },
                                padding: 10
                              }
                            },
                            title: {
                              display: true,
                              text: `Dữ liệu cảm biến ${chartPeriod === '7d' ? '7 ngày' : chartPeriod} qua`,
                              font: {
                                size: 14,
                                weight: 'bold'
                              },
                              padding: {
                                top: 5,
                                bottom: 10
                              }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              titleColor: '#333',
                              bodyColor: '#666',
                              borderColor: 'rgba(0, 0, 0, 0.1)',
                              borderWidth: 1,
                              padding: 10,
                              boxPadding: 5,
                              usePointStyle: true,
                              callbacks: {
                                title: function(tooltipItems) {
                                  const item = tooltipItems[0];
                                  const label = item.label;
                                  if (chartPeriod === '7d') {
                                    return `Ngày ${label}`;
                                  } else {
                                    return `Thời gian: ${label}`;
                                  }
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                font: {
                                  size: 11
                                }
                              },
                              grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                              }
                            },
                            x: {
                              ticks: {
                                font: {
                                  size: 11
                                },
                                maxRotation: 45,
                                minRotation: 45,
                                autoSkip: true,
                                maxTicksLimit: chartPeriod === '7d' ? 14 : 24
                              },
                              grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <ChartBar
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                              labels: {
                                font: {
                                  size: 12
                                },
                                padding: 10
                              }
                            },
                            title: {
                              display: true,
                              text: `Dữ liệu cảm biến ${chartPeriod === '7d' ? '7 ngày' : chartPeriod} qua`,
                              font: {
                                size: 14,
                                weight: 'bold'
                              },
                              padding: {
                                top: 5,
                                bottom: 10
                              }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              titleColor: '#333',
                              bodyColor: '#666',
                              borderColor: 'rgba(0, 0, 0, 0.1)',
                              borderWidth: 1,
                              padding: 10,
                              boxPadding: 5,
                              usePointStyle: true,
                              callbacks: {
                                title: function(tooltipItems) {
                                  const item = tooltipItems[0];
                                  const label = item.label;
                                  if (chartPeriod === '7d') {
                                    return `Ngày ${label}`;
                                  } else {
                                    return `Thời gian: ${label}`;
                                  }
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                font: {
                                  size: 11
                                }
                              },
                              grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                              }
                            },
                            x: {
                              ticks: {
                                font: {
                                  size: 11
                                },
                                maxRotation: 45,
                                minRotation: 45,
                                autoSkip: true,
                                maxTicksLimit: chartPeriod === '7d' ? 14 : 24
                              },
                              grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                              }
                            }
                          }
                        }}
                      />
                    )}
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Cập nhật lần cuối: {lastChartUpdate ? lastChartUpdate.toLocaleString('vi-VN') : 'Không có dữ liệu'}
                        </Typography>
                        {chartData && chartData._rawData && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Tổng số điểm dữ liệu: {chartData._rawData.count} | Từ {new Date(chartData._rawData.firstTimestamp).toLocaleTimeString('vi-VN')} đến {new Date(chartData._rawData.lastTimestamp).toLocaleTimeString('vi-VN')}
                          </Typography>
                        )}
                        {lastChartUpdate && (() => {
                          const now = new Date();
                          const timeSinceLastData = (now - lastChartUpdate) / (1000 * 60); // Số phút
                          if (timeSinceLastData > 60) {
                            return (
                              <Typography variant="caption" color="error" sx={{ display: 'block', fontWeight: 'bold' }}>
                                Cảnh báo: Dữ liệu không được cập nhật trong {Math.floor(timeSinceLastData)} phút qua!
                              </Typography>
                            );
                          }
                          return null;
                        })()}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={`${chartData.labels ? chartData.labels.length : 0} điểm hiển thị`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ height: 24, fontSize: '0.7rem', mr: 1 }}
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => fetchChartData(chartPeriod)}
                          title="Làm mới dữ liệu biểu đồ"
                          sx={{ 
                            width: 28, 
                            height: 28,
                            color: 'primary.main',
                            '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                          }}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    </Box>
                  )}
              </Box>
                </CardContent>
              </Card>
            </Grid>
            
        {/* Thông tin vườn */}
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  borderRadius: 2, 
                  overflow: 'visible',
                  height: '100%',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  backgroundImage: 'linear-gradient(to bottom, rgba(25, 118, 210, 0.02), rgba(25, 118, 210, 0.05))',
                  transition: 'all 0.3s ease',
                  opacity: getDataOpacity(),
                }}
              >
                {/* Badge hiển thị trạng thái phân tích */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '-12px',
                    left: 'calc(50% - 60px)',
                    width: '120px',
                    height: '24px',
                    backgroundColor: latestAnalysis ? '#4caf50' : '#9e9e9e',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    zIndex: 10,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>
                    {latestAnalysis ? "PHÂN TÍCH SẴN SÀNG" : "CHƯA CÓ PHÂN TÍCH"}
                  </Typography>
                </Box>

                <CardContent sx={{ p: 3, pt: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Box sx={{ position: 'relative', textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          backgroundColor: 'primary.light',
                          margin: '0 auto 8px',
                        }}
                      >
                        <AnalyticsIcon sx={{ fontSize: 36 }} />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center' }}>
                        Phân tích thông minh
                      </Typography>
                    </Box>
                  </Box>
                  
                  {!selectedGardenId ? (
                    <Box sx={{ textAlign: 'center', py: 3, px: 2 }}>
                      <Box sx={{ mb: 2, opacity: 0.7 }}>
                        <ErrorOutlineIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                      </Box>
                      <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                        Vui lòng chọn vườn từ danh sách để xem phân tích
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<YardIcon />}
                      >
                        Chọn vườn
                      </Button>
                    </Box>
                  ) : analysisLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, px: 3 }}>
                      <CircularProgress size={48} thickness={4} sx={{ mb: 3 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        Đang tải phân tích mới nhất...
                      </Typography>
                    </Box>
                  ) : analysisError ? (
                    <Box sx={{ py: 3, px: 2 }}>
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mb: 2,
                          alignItems: 'center',
                          '& .MuiAlert-icon': {
                            fontSize: 28,
                            opacity: 0.8
                          }
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                            Lỗi khi tải phân tích
                          </Typography>
                          <Typography variant="body2">
                            {analysisError}
                          </Typography>
                        </Box>
                      </Alert>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        onClick={() => fetchLatestAnalysis(selectedGardenId)}
                        startIcon={<RefreshIcon />}
                      >
                        Thử lại
                      </Button>
                    </Box>
                  ) : !latestAnalysis ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 3, 
                      px: 2,
                      background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 150, 243, 0.02) 100%)',
                      borderRadius: 2,
                      border: '1px dashed rgba(25, 118, 210, 0.4)',
                    }}>
                      <ScienceIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.4, mb: 2 }} />
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                        Chưa có phân tích cho vườn này
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Tạo phân tích mới để nhận đánh giá và đề xuất thông minh cho vườn của bạn
                      </Typography>
                      <Button 
                        variant="contained" 
                        component={RouterLink} 
                        to={`/gardens/${selectedGardenId}/analysis`}
                        startIcon={<PlayArrowIcon />}
                        sx={{ 
                          borderRadius: '20px',
                          px: 3,
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                        }}
                      >
                        Tạo phân tích mới
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ p: 0 }}>
                      {/* Thời gian và khoảng thời gian */}
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          mb: 3, 
                          borderRadius: 2,
                          background: 'linear-gradient(145deg, rgba(25, 118, 210, 0.08), rgba(25, 118, 210, 0.02))',
                          border: '1px solid rgba(25, 118, 210, 0.1)'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {latestAnalysis.data_period === '24h' ? '24 giờ qua' : 
                               latestAnalysis.data_period === '7d' ? '7 ngày qua' : '30 ngày qua'}
                            </Typography>
                          </Box>
                          <Tooltip title={new Date(latestAnalysis.created_at).toLocaleString()}>
                            <Chip 
                              label={`Phân tích ${new Date(latestAnalysis.created_at).toLocaleDateString()}`}
                              size="small" 
                              sx={{ height: 24, fontSize: '0.7rem' }}
                            />
                          </Tooltip>
                        </Box>
                      </Paper>

                      {/* Tóm tắt phân tích */}
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mb: 3, 
                          fontWeight: 500, 
                          fontSize: '0.95rem',
                          lineHeight: 1.5,
                          fontStyle: 'italic',
                          color: 'text.primary',
                          position: 'relative',
                          pl: 2,
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            borderRadius: 4,
                            backgroundColor: 'primary.main',
                            opacity: 0.7
                          }
                        }}
                      >
                        {latestAnalysis.analysis_summary?.length > 150 
                          ? `"${latestAnalysis.analysis_summary.substring(0, 150).trim()}..."`
                          : `"${latestAnalysis.analysis_summary}"`}
                      </Typography>
                      
                      {/* Thẻ điều kiện môi trường */}
                      {latestAnalysis.environmental_conditions && 
                       latestAnalysis.environmental_conditions.length > 0 && (
                        <Box 
                          sx={{ 
                            mb: 3,
                            position: 'relative',
                          }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: '1px solid rgba(220, 0, 78, 0.12)',
                              background: 'linear-gradient(145deg, rgba(220, 0, 78, 0.04), rgba(220, 0, 78, 0.01))',
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            <Box 
                              sx={{ 
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '6px',
                                height: '100%',
                                backgroundColor: 'error.main',
                                opacity: 0.7
                              }}
                            />
                            
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  backgroundColor: 'error.light',
                                  mr: 2,
                                }}
                              >
                                <FireplaceIcon sx={{ fontSize: 20, color: 'error.main' }} />
                              </Avatar>
                              
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'error.main' }}>
                                  Điều kiện quan trọng
                                </Typography>
                                <Typography variant="body2">
                                  {latestAnalysis.environmental_conditions[0].observation.length > 120
                                    ? `${latestAnalysis.environmental_conditions[0].observation.substring(0, 120).trim()}...`
                                    : latestAnalysis.environmental_conditions[0].observation}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </Box>
                      )}
                      
                      {/* Thẻ đề xuất hàng đầu */}
                      {latestAnalysis.recommendations && 
                       latestAnalysis.recommendations.length > 0 && (
                        <Box 
                          sx={{ 
                            mb: 3,
                            position: 'relative',
                          }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: '1px solid rgba(76, 175, 80, 0.12)',
                              background: 'linear-gradient(145deg, rgba(76, 175, 80, 0.04), rgba(76, 175, 80, 0.01))',
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            <Box 
                              sx={{ 
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '6px',
                                height: '100%',
                                backgroundColor: 'success.main',
                                opacity: 0.7
                              }}
                            />
                            
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  backgroundColor: 'success.light',
                                  mr: 2,
                                }}
                              >
                                <EmojiObjectsIcon sx={{ fontSize: 20, color: 'success.main' }} />
                              </Avatar>
                              
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'success.main' }}>
                                  Đề xuất hàng đầu
                                </Typography>
                                <Typography variant="body2">
                                  {latestAnalysis.recommendations[0].recommendation.length > 120
                                    ? `${latestAnalysis.recommendations[0].recommendation.substring(0, 120).trim()}...`
                                    : latestAnalysis.recommendations[0].recommendation}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </Box>
                      )}

                      {/* Đánh giá sức khỏe tổng thể */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <WaterOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} /> Sức khỏe tổng thể
                        </Typography>
                        
                        <Box sx={{ mt: 1, position: 'relative' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={latestAnalysis.health_score || 75} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: 'rgba(0,0,0,0.05)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: latestAnalysis.health_score >= 80 
                                  ? 'linear-gradient(90deg, #66BB6A, #43A047)' 
                                  : latestAnalysis.health_score >= 50 
                                    ? 'linear-gradient(90deg, #FFA726, #FB8C00)' 
                                    : 'linear-gradient(90deg, #EF5350, #D32F2F)',
                              }
                            }} 
                          />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>0%</Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: 700,
                                color: latestAnalysis.health_score >= 80 
                                  ? 'success.main' 
                                  : latestAnalysis.health_score >= 50 
                                    ? 'warning.main' 
                                    : 'error.main',
                              }}
                            >
                              {latestAnalysis.health_score || 75}%
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>100%</Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Button thao tác */}
                      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                        <Button 
                          variant="contained" 
                          component={RouterLink} 
                          to={`/gardens/${selectedGardenId}/analysis`}
                          fullWidth
                          endIcon={<ArrowForwardIcon />}
                          sx={{ 
                            borderRadius: '20px',
                            background: 'linear-gradient(90deg, #1976d2, #2196f3)',
                            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                          }}
                        >
                          Xem phân tích đầy đủ
                        </Button>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
      </Grid>

      {/* Điều khiển thiết bị */}
      <Grid container spacing={4} sx={{ mb: 5 }}>
                <Grid item xs={12}>
          <Card 
            sx={{ 
              borderRadius: 2, 
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
              },
              opacity: getDataOpacity(),
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Điều khiển thiết bị
                      </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quản lý các thiết bị trong vườn của bạn
                  </Typography>
                </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={deviceStatus.auto}
                            onChange={handleToggleAutoMode}
                      disabled={controlLoading.auto || !selectedGardenId}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#4CAF50',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#4CAF50',
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                        Kích hoạt lịch trình
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        {deviceStatus.auto 
                          ? 'Các lịch trình đang được kích hoạt' 
                          : 'Các lịch trình đang bị vô hiệu hóa'}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
              
              <Grid container spacing={3}>
                {/* Quạt */}
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                      },
                      ...(deviceStatus.fan && {
                        background: 'linear-gradient(145deg, rgba(76, 175, 80, 0.08), rgba(76, 175, 80, 0.02))',
                        borderColor: 'rgba(76, 175, 80, 0.3)',
                      })
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: deviceStatus.fan ? 'rgba(76, 175, 80, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                            mr: 2,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <FanIcon 
                            sx={{ 
                              color: deviceStatus.fan ? '#4CAF50' : 'text.disabled',
                              fontSize: 24,
                              animation: deviceStatus.fan ? 'spin 4s linear infinite' : 'none',
                              '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' },
                              }
                            }} 
                          />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            Quạt
                          </Typography>
                          <Typography variant="body2" color={deviceStatus.fan ? 'success.main' : 'text.secondary'}>
                            {deviceStatus.fan ? 'Đang hoạt động' : 'Đã tắt'}
                          </Typography>
                        </Box>
                      </Box>
                          <Switch
                            checked={deviceStatus.fan}
                            onChange={() => handleControlDevice('FAN', !deviceStatus.fan)}
                        disabled={deviceStatus.auto || controlLoading.fan || !selectedGardenId}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#4CAF50',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#4CAF50',
                          },
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed rgba(0, 0, 0, 0.06)' }}>
                      <Typography variant="caption" color="text.secondary">
                        Trạng thái: {controlLoading.fan ? (
                          <CircularProgress size={10} sx={{ ml: 1 }} />
                        ) : deviceStatus.auto ? (
                          <Chip 
                            label="Tự động" 
                            size="small" 
                            color="primary" 
                            sx={{ height: 20, fontSize: '0.625rem', ml: 1 }} 
                          />
                        ) : (
                          <Chip 
                            label="Thủ công" 
                            size="small" 
                            color="default" 
                            sx={{ height: 20, fontSize: '0.625rem', ml: 1 }} 
                          />
                        )}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Đèn */}
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                      },
                      ...(deviceStatus.light && {
                        background: 'linear-gradient(145deg, rgba(255, 193, 7, 0.08), rgba(255, 193, 7, 0.02))',
                        borderColor: 'rgba(255, 193, 7, 0.3)',
                      })
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: deviceStatus.light ? 'rgba(255, 193, 7, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                            mr: 2,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <LightIcon 
                            sx={{ 
                              color: deviceStatus.light ? '#FFC107' : 'text.disabled',
                              fontSize: 24,
                              animation: deviceStatus.light ? 'pulse 2s ease-in-out infinite' : 'none',
                              '@keyframes pulse': {
                                '0%': { opacity: 1 },
                                '50%': { opacity: 0.6 },
                                '100%': { opacity: 1 },
                              }
                            }} 
                          />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            Đèn
                          </Typography>
                          <Typography variant="body2" color={deviceStatus.light ? 'warning.main' : 'text.secondary'}>
                            {deviceStatus.light ? 'Đang hoạt động' : 'Đã tắt'}
                          </Typography>
                        </Box>
                      </Box>
                          <Switch
                            checked={deviceStatus.light}
                            onChange={() => handleControlDevice('LIGHT', !deviceStatus.light)}
                        disabled={deviceStatus.auto || controlLoading.light || !selectedGardenId}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#FFC107',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#FFC107',
                          },
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed rgba(0, 0, 0, 0.06)' }}>
                      <Typography variant="caption" color="text.secondary">
                        Trạng thái: {controlLoading.light ? (
                          <CircularProgress size={10} sx={{ ml: 1 }} />
                        ) : deviceStatus.auto ? (
                          <Chip 
                            label="Tự động" 
                            size="small" 
                            color="primary" 
                            sx={{ height: 20, fontSize: '0.625rem', ml: 1 }} 
                          />
                        ) : (
                          <Chip 
                            label="Thủ công" 
                            size="small" 
                            color="default" 
                            sx={{ height: 20, fontSize: '0.625rem', ml: 1 }} 
                          />
                        )}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Máy bơm */}
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                      },
                      ...(deviceStatus.pump && {
                        background: 'linear-gradient(145deg, rgba(33, 150, 243, 0.08), rgba(33, 150, 243, 0.02))',
                        borderColor: 'rgba(33, 150, 243, 0.3)',
                      })
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: deviceStatus.pump ? 'rgba(33, 150, 243, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                            mr: 2,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <PumpIcon 
                            sx={{ 
                              color: deviceStatus.pump ? '#2196F3' : 'text.disabled',
                              fontSize: 24,
                              animation: deviceStatus.pump ? 'bounce 1.5s ease infinite' : 'none',
                              '@keyframes bounce': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-5px)' },
                              }
                            }} 
                          />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            Máy bơm
                          </Typography>
                          <Typography variant="body2" color={deviceStatus.pump ? 'info.main' : 'text.secondary'}>
                            {deviceStatus.pump ? 'Đang hoạt động' : 'Đã tắt'}
                        </Typography>
                        </Box>
                      </Box>
                      <Switch
                        checked={deviceStatus.pump}
                        onChange={() => handleControlDevice('PUMP', !deviceStatus.pump)}
                        disabled={deviceStatus.auto || controlLoading.pump || !selectedGardenId}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#2196F3',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#2196F3',
                          },
                        }}
                      />
                      </Box>
                      
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed rgba(0, 0, 0, 0.06)' }}>
                      <Typography variant="caption" color="text.secondary">
                        Trạng thái: {controlLoading.pump ? (
                          <CircularProgress size={10} sx={{ ml: 1 }} />
                        ) : deviceStatus.auto ? (
                          <Chip 
                            label="Tự động" 
                            size="small" 
                            color="primary" 
                            sx={{ height: 20, fontSize: '0.625rem', ml: 1 }} 
                          />
                        ) : (
                          <Chip 
                            label="Thủ công" 
                            size="small" 
                            color="default" 
                            sx={{ height: 20, fontSize: '0.625rem', ml: 1 }} 
                          />
                        )}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
              
              <Box 
                sx={{ 
                  mt: 3, 
                  pt: 3, 
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Chế độ hiện tại: <strong>{deviceStatus.auto ? "Tự động" : "Thủ công"}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cập nhật lần cuối: {formatTime(new Date())}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  startIcon={<RefreshIcon />}
                  onClick={fetchDeviceStatus}
                  disabled={!selectedGardenId}
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Làm mới
                </Button>
              </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
    </Box>
  );
};

export default Dashboard; 