import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  Add as AddIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Thermostat as ThermostatIcon,
  WaterDrop as WaterDropIcon,
  WbSunny as SunIcon,
  Grass as GrassIcon,
  Air as FanIcon,
  Lightbulb as LightIcon,
  Opacity as PumpIcon,
  InfoOutlined as InfoIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  CancelOutlined as CancelIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {
  requestAnalysis,
  getAnalysisReports,
  getAnalysisDetail,
  applyRecommendations,
  testGeminiConnection
} from '../services/analysisService';
import { getGardenById } from '../services/gardenService';
import { formatDate, formatTime } from '../utils/formatters';

// Tab Panel - sử dụng memo để tối ưu
const TabPanel = memo(function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
});

// Component hiển thị trạng thái - memoized
const StatusChip = memo(({ type, label, color, icon }) => {
  return (
    <Chip 
      icon={icon} 
      label={label} 
      color={color} 
      size="small" 
    />
  );
});

// Component card môi trường - memoized
const EnvironmentConditionCard = memo(({ icon, title, condition, description }) => {
  // Xác định trạng thái condition từ text
  const getConditionStatus = useCallback((text) => {
    if (!text) return null;
    
    if (text.includes('lý tưởng') || text.includes('tốt')) {
      return <StatusChip icon={<CheckCircleIcon />} label="Tốt" color="success" />;
    } else if (text.includes('thấp') || text.includes('cao') || text.includes('cần chú ý')) {
      return <StatusChip icon={<WarningIcon />} label="Cần chú ý" color="warning" />;
    } else {
      return <StatusChip icon={<InfoIcon />} label="Bình thường" color="primary" />;
    }
  }, []);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>{title}</Typography>
          {getConditionStatus(description)}
        </Box>
        <Typography variant="body2">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
});

// Component đề xuất thiết bị - memoized
const DeviceRecommendationCard = memo(({ icon, title, action, schedule }) => {
  const getActionStatus = useCallback((actionType) => {
    return actionType === 'ON' ? 
      <StatusChip icon={<CheckCircleIcon />} label="BẬT" color="success" /> :
      <StatusChip icon={<CancelIcon />} label="TẮT" color="error" />;
  }, []);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>{title}</Typography>
          {getActionStatus(action)}
        </Box>
        <Typography variant="body2" gutterBottom>
          <strong>Lịch trình đề xuất:</strong> {schedule || 'Không có'}
        </Typography>
      </CardContent>
    </Card>
  );
});

// Component hiển thị danh sách báo cáo - memoized
const ReportsList = memo(({ reports, isLoading, onViewReport, onNewAnalysis, onTestConnection, isTestingConnection }) => {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={isTestingConnection ? <CircularProgress size={20} /> : <InfoIcon />}
          onClick={onTestConnection}
          disabled={isTestingConnection}
          sx={{ mr: 1 }}
        >
          {isTestingConnection ? 'Đang kiểm tra...' : 'Kiểm tra kết nối Gemini'}
        </Button>
        <Button
          variant="contained"
          startIcon={<AnalyticsIcon />}
          onClick={onNewAnalysis}
          color="primary"
        >
          Phân tích mới
        </Button>
      </Box>
      
      {isLoading ? (
        <Box sx={{ width: '100%', my: 4 }}>
          <LinearProgress />
        </Box>
      ) : reports.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Thời gian</TableCell>
                <TableCell>Khoảng dữ liệu</TableCell>
                <TableCell>Tóm tắt</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report._id}>
                  <TableCell>{formatDate(report.created_at)}</TableCell>
                  <TableCell>
                    {report.data_period === '24h' && '24 giờ qua'}
                    {report.data_period === '7d' && '7 ngày qua'}
                    {report.data_period === '30d' && '30 ngày qua'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 400 }} className="truncate-text">
                    {report.analysis_summary}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => onViewReport(report._id)}
                    >
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info" sx={{ my: 4 }}>
          Chưa có báo cáo phân tích nào. Hãy yêu cầu phân tích mới để nhận đề xuất chăm sóc vườn.
        </Alert>
      )}
    </>
  );
});

// Component hiển thị chi tiết điều kiện môi trường
const EnvironmentalConditions = memo(({ conditions }) => {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Phân tích điều kiện môi trường
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <EnvironmentConditionCard 
            icon={<ThermostatIcon color="error" />} 
            title="Nhiệt độ" 
            description={conditions.temperature} 
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <EnvironmentConditionCard 
            icon={<WaterDropIcon color="primary" />} 
            title="Độ ẩm không khí" 
            description={conditions.humidity} 
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <EnvironmentConditionCard 
            icon={<SunIcon color="warning" />} 
            title="Ánh sáng" 
            description={conditions.light} 
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <EnvironmentConditionCard 
            icon={<GrassIcon color="success" />} 
            title="Độ ẩm đất" 
            description={conditions.soil} 
          />
        </Grid>
      </Grid>
    </>
  );
});

// Component hiển thị đề xuất
const Recommendations = memo(({ recommendations, onApply, reportId }) => {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Đề xuất chăm sóc
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tóm tắt
          </Typography>
          <Typography variant="body1">
            {recommendations.general}
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            startIcon={<PlayIcon />}
            variant="contained"
            color="success"
            onClick={() => onApply(reportId)}
          >
            Áp dụng đề xuất
          </Button>
        </CardActions>
      </Card>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <DeviceRecommendationCard 
            icon={<FanIcon />} 
            title="Quạt" 
            action={recommendations.fan.action}
            schedule={recommendations.fan.schedule}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <DeviceRecommendationCard 
            icon={<LightIcon />} 
            title="Đèn" 
            action={recommendations.light.action}
            schedule={recommendations.light.schedule}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <DeviceRecommendationCard 
            icon={<PumpIcon />} 
            title="Máy bơm" 
            action={recommendations.pump.action}
            schedule={recommendations.pump.schedule}
          />
        </Grid>
      </Grid>
    </>
  );
});

// Component hiển thị hành động đã thực hiện
const ActionsTaken = memo(({ actions }) => {
  const getDeviceIcon = useCallback((device) => {
    switch (device) {
      case 'FAN':
        return <FanIcon />;
      case 'LIGHT':
        return <LightIcon />;
      case 'PUMP':
        return <PumpIcon />;
      case 'AUTO':
        return <AutoAwesomeIcon />;
      default:
        return <InfoIcon />;
    }
  }, []);

  if (!actions || actions.length === 0) return null;

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Hành động đã thực hiện
      </Typography>
      <Card sx={{ mb: 4 }}>
        <List>
          {actions.map((action, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                {getDeviceIcon(action.device)}
              </ListItemIcon>
              <ListItemText
                primary={`${action.device === 'FAN' ? 'Quạt' : 
                          action.device === 'LIGHT' ? 'Đèn' : 
                          action.device === 'PUMP' ? 'Máy bơm' : 
                          'Tự động'} - ${action.action === 'ON' ? 'BẬT' : 'TẮT'}`}
                secondary={`Thời gian: ${formatTime(action.applied_at)}${action.schedule ? ` • Lịch trình: ${action.schedule}` : ''}`}
              />
            </ListItem>
          ))}
        </List>
      </Card>
    </>
  );
});

// Component chi tiết báo cáo - memoized
const ReportDetail = memo(({ report, onApplyRecommendations }) => {
  if (!report) {
    return (
      <Alert severity="info">
        Vui lòng chọn một báo cáo phân tích từ tab Lịch sử để xem chi tiết.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Phân tích vườn lúc {formatTime(report.created_at)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dữ liệu {
            report.data_period === '24h' ? '24 giờ qua' : 
            report.data_period === '7d' ? '7 ngày qua' : 
            '30 ngày qua'
          }
        </Typography>
      </Box>
      
      {/* Tóm tắt */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tóm tắt
          </Typography>
          <Typography variant="body1">
            {report.analysis_summary}
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            startIcon={<PlayIcon />}
            variant="contained"
            color="success"
            onClick={() => onApplyRecommendations(report._id)}
          >
            Áp dụng đề xuất
          </Button>
        </CardActions>
      </Card>
      
      {/* Điều kiện môi trường */}
      <EnvironmentalConditions conditions={report.environmental_conditions} />
      
      {/* Đề xuất */}
      <Recommendations 
        recommendations={report.recommendations} 
        onApply={onApplyRecommendations}
        reportId={report._id}
      />
      
      {/* Hành động đã thực hiện */}
      <ActionsTaken actions={report.actions_taken} />
    </Box>
  );
});

// Component chính
const GardenAnalysis = () => {
  const { id: gardenId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  
  // States
  const [garden, setGarden] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [duration, setDuration] = useState('24h');
  const [applyDialog, setApplyDialog] = useState({ open: false, reportId: null });
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, pages: 0 });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  // Fetch garden details - useCallback để tối ưu
  const fetchGarden = useCallback(async () => {
    if (!gardenId || gardenId === 'undefined') return;
    
    try {
      setIsLoading(true);
      console.log(`Đang tải thông tin vườn với ID: ${gardenId}`);
      const response = await getGardenById(gardenId);
      if (response.success) {
        setGarden(response.data);
      } else {
        console.warn('Không thể tải thông tin vườn:', response);
        toast.warning('Không thể tải thông tin vườn');
      }
    } catch (error) {
      console.error('Error fetching garden:', error);
      toast.error('Lỗi khi tải thông tin vườn');
    } finally {
      setIsLoading(false);
    }
  }, [gardenId]);
  
  // Tải danh sách báo cáo phân tích - useCallback để tối ưu
  const fetchReports = useCallback(async () => {
    if (!gardenId || gardenId === 'undefined') return;
    
    try {
      setIsReportsLoading(true);
      const response = await getAnalysisReports(gardenId, {
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response.success) {
        setReports(response.data.reports);
        setPagination(response.data.pagination);
      } else {
        toast.error('Không thể tải danh sách báo cáo phân tích');
      }
    } catch (error) {
      console.error('Error fetching analysis reports:', error);
      toast.error('Lỗi khi tải danh sách báo cáo phân tích');
    } finally {
      setIsReportsLoading(false);
    }
  }, [gardenId, pagination.page, pagination.limit]);
  
  // Xem chi tiết báo cáo - useCallback để tối ưu
  const handleViewReport = useCallback(async (reportId) => {
    try {
      setIsLoading(true);
      console.log(`Đang tải chi tiết báo cáo với ID: ${reportId}`);
      
      const response = await getAnalysisDetail(gardenId, reportId);
      console.log('Phản hồi từ API getAnalysisDetail:', response);
      
      if (response.success === false) {
        console.error('Lỗi khi tải chi tiết báo cáo:', response.message);
        toast.error('Không thể tải chi tiết báo cáo');
        return;
      }
      
      // Kiểm tra xem phản hồi có chứa report không
      const report = response.report || (response.data && response.data.report);
      
      if (!report) {
        console.error('Không tìm thấy dữ liệu báo cáo trong phản hồi:', response);
        toast.error('Lỗi: Không tìm thấy dữ liệu báo cáo');
        return;
      }
      
      setCurrentReport(report);
      setTabValue(1); // Chuyển đến tab chi tiết
    } catch (error) {
      console.error('Error fetching report details:', error);
      toast.error('Lỗi khi tải chi tiết báo cáo');
    } finally {
      setIsLoading(false);
    }
  }, [gardenId]);
  
  // Yêu cầu phân tích mới - useCallback để tối ưu
  const handleRequestAnalysis = useCallback(async () => {
    setDialogOpen(false);
    
    try {
      setIsAnalyzing(true);
      toast.info('Đang phân tích dữ liệu, vui lòng đợi...');
      
      console.log(`Đang gửi yêu cầu phân tích cho vườn: ${gardenId} với thời gian: ${duration}`);
      const response = await requestAnalysis(gardenId, { duration });
      
      console.log('Phản hồi từ API phân tích:', response);
      
      if (response.success === false) {
        console.error('Lỗi phân tích dữ liệu:', response.message);
        toast.error(`Không thể phân tích dữ liệu: ${response.message}`);
        return;
      }
      
      const reportId = response.report_id || (response.data && response.data.report_id);
      
      if (!reportId) {
        console.error('Không tìm thấy report_id trong phản hồi:', response);
        toast.error('Lỗi: Không tìm thấy ID báo cáo trong phản hồi');
        return;
      }
      
      toast.success('Phân tích dữ liệu thành công!');
      
      // Tải chi tiết báo cáo mới tạo
      await handleViewReport(reportId);
      
      // Làm mới danh sách báo cáo
      fetchReports();
    } catch (error) {
      console.error('Error analyzing garden data:', error);
      
      let errorMessage = 'Lỗi khi phân tích dữ liệu';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [gardenId, duration, handleViewReport, fetchReports]);
  
  // Áp dụng đề xuất - useCallback để tối ưu
  const handleApplyRecommendations = useCallback(async () => {
    setApplyDialog({ ...applyDialog, open: false });
    
    if (!applyDialog.reportId) return;
    
    try {
      setIsLoading(true);
      console.log('Đang gửi yêu cầu áp dụng đề xuất...');
      const response = await applyRecommendations(gardenId, applyDialog.reportId);
      console.log('Phản hồi sau khi xử lý từ API:', response);
      
      if (response && response.success) {
        toast.success('Đã áp dụng đề xuất thành công!');
        
        const schedules = response.data?.schedules || [];
        if (schedules.length > 0) {
          toast.info(`Đã tạo ${schedules.length} lịch trình tự động từ đề xuất AI`);
          
          setTimeout(() => {
            toast.info('Để xem và quản lý lịch trình, hãy vào trang "Lịch trình"');
          }, 1000);
        }
        
        // Làm mới dữ liệu
        const reportResponse = await getAnalysisDetail(gardenId, applyDialog.reportId);
        if (reportResponse.success) {
          setCurrentReport(reportResponse.data.report);
        }
        
        toast.info('Chế độ tự động đã được bật để thực thi các lịch trình');
      } else {
        const errorMessage = response?.message || 'Không thể áp dụng đề xuất';
        console.error('Lỗi khi áp dụng đề xuất:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error applying recommendations:', error);
      toast.error(error.message || 'Lỗi khi áp dụng đề xuất');
    } finally {
      setIsLoading(false);
    }
  }, [applyDialog.reportId, gardenId]);
  
  // Mở dialog áp dụng đề xuất - useCallback để tối ưu
  const handleOpenApplyDialog = useCallback((reportId) => {
    setApplyDialog({ open: true, reportId });
  }, []);
  
  // Xử lý thay đổi tab - useCallback để tối ưu
  const handleTabChange = useCallback((event, newValue) => {
    setTabValue(newValue);
    
    // Làm mới danh sách khi quay lại tab lịch sử
    if (newValue === 0) {
      fetchReports();
    }
  }, [fetchReports]);
  
  // Hàm kiểm tra kết nối Gemini API - useCallback để tối ưu
  const handleTestGeminiConnection = useCallback(async () => {
    try {
      setIsTestingConnection(true);
      toast.info('Đang kiểm tra kết nối Gemini API...');
      
      const response = await testGeminiConnection(gardenId);
      
      if (response.success) {
        toast.success(`Kết nối thành công: ${response.data.response}`);
      } else {
        toast.error(`Kiểm tra kết nối thất bại: ${response.message}`);
      }
    } catch (error) {
      console.error('Error testing Gemini connection:', error);
      toast.error(`Lỗi khi kiểm tra kết nối: ${error.message || 'Không xác định'}`);
    } finally {
      setIsTestingConnection(false);
    }
  }, [gardenId]);
  
  // Xử lý thay đổi thời gian - useCallback để tối ưu
  const handleDurationChange = useCallback((e) => {
    setDuration(e.target.value);
  }, []);
  
  // Hiển thị dialog phân tích mới - useCallback để tối ưu
  const handleOpenAnalysisDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);
  
  // Đóng dialog phân tích mới - useCallback để tối ưu
  const handleCloseAnalysisDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);
  
  // Đóng dialog áp dụng đề xuất - useCallback để tối ưu
  const handleCloseApplyDialog = useCallback(() => {
    setApplyDialog(prev => ({ ...prev, open: false }));
  }, []);
  
  // Kiểm tra gardenId và fetch data
  useEffect(() => {
    if (!gardenId || gardenId === 'undefined') {
      console.log('Không có Garden ID, đang ở trang phân tích chung');
      return;
    }
    
    fetchGarden();
  }, [gardenId, fetchGarden]);
  
  // Tải danh sách báo cáo phân tích
  useEffect(() => {
    if (gardenId && gardenId !== 'undefined') {
      fetchReports();
    }
  }, [gardenId, pagination.page, pagination.limit, fetchReports]);
  
  // Loading state
  const isPageLoading = useMemo(() => isLoading && !garden, [isLoading, garden]);
  
  // Page loading
  if (isPageLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ padding: { xs: 1, md: 2 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Phân tích dữ liệu vườn
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {garden?.name}
        </Typography>
      </Box>
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="analysis tabs"
          >
            <Tab label="Lịch sử phân tích" id="analysis-tab-0" />
            <Tab 
              label="Chi tiết phân tích" 
              id="analysis-tab-1"
              disabled={!currentReport} 
            />
          </Tabs>
        </Box>
        
        {/* Tab Lịch sử phân tích */}
        <TabPanel value={tabValue} index={0}>
          <ReportsList 
            reports={reports}
            isLoading={isReportsLoading}
            onViewReport={handleViewReport}
            onNewAnalysis={handleOpenAnalysisDialog}
            onTestConnection={handleTestGeminiConnection}
            isTestingConnection={isTestingConnection}
          />
        </TabPanel>
        
        {/* Tab Chi tiết phân tích */}
        <TabPanel value={tabValue} index={1}>
          <ReportDetail 
            report={currentReport}
            onApplyRecommendations={handleOpenApplyDialog}
          />
        </TabPanel>
      </Paper>
      
      {/* Dialog phân tích mới */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseAnalysisDialog}
      >
        <DialogTitle>Phân tích dữ liệu vườn</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Chọn khoảng thời gian để phân tích dữ liệu và đưa ra đề xuất chăm sóc vườn.
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Khoảng thời gian</InputLabel>
            <Select
              value={duration}
              label="Khoảng thời gian"
              onChange={handleDurationChange}
            >
              <MenuItem value="24h">24 giờ qua</MenuItem>
              <MenuItem value="7d">7 ngày qua</MenuItem>
              <MenuItem value="30d">30 ngày qua</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAnalysisDialog}>Hủy</Button>
          <Button 
            onClick={handleRequestAnalysis}
            variant="contained"
            disabled={isAnalyzing}
            startIcon={isAnalyzing ? <CircularProgress size={20} /> : <AnalyticsIcon />}
          >
            {isAnalyzing ? 'Đang phân tích...' : 'Phân tích'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog áp dụng đề xuất */}
      <Dialog
        open={applyDialog.open}
        onClose={handleCloseApplyDialog}
      >
        <DialogTitle>Áp dụng đề xuất</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có muốn áp dụng tất cả đề xuất này? Hệ thống sẽ gửi lệnh điều khiển đến các thiết bị theo đề xuất.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApplyDialog}>Hủy</Button>
          <Button 
            onClick={handleApplyRecommendations}
            variant="contained"
            color="success"
          >
            Áp dụng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default memo(GardenAnalysis); 