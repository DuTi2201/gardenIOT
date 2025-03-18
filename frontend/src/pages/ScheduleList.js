import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  IconButton,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  FormHelperText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormGroup,
  Checkbox,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PowerSettingsNew as PowerIcon,
} from '@mui/icons-material';
import { getGardenById } from '../services/gardenService';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, toggleSchedule } from '../services/scheduleService';
import { toast } from 'react-toastify';

// Ngày trong tuần - định nghĩa bên ngoài component để tránh tạo lại mỗi khi render
const DAYS_OF_WEEK = [
  { value: 0, label: 'Chủ nhật' },
  { value: 1, label: 'Thứ hai' },
  { value: 2, label: 'Thứ ba' },
  { value: 3, label: 'Thứ tư' },
  { value: 4, label: 'Thứ năm' },
  { value: 5, label: 'Thứ sáu' },
  { value: 6, label: 'Thứ bảy' },
];

// Tách các hàm tiện ích ra ngoài component - Memoized
const formatTime = (hour, minute) => {
  // Bảo vệ để tránh lỗi khi hour hoặc minute không xác định
  if (hour === undefined || minute === undefined) {
    return "00:00";
  }
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Hiển thị tên thiết bị - Memoized
const getDeviceName = (device) => {
  switch (device) {
    case 'FAN':
      return 'Quạt';
    case 'LIGHT':
      return 'Đèn';
    case 'PUMP':
      return 'Máy bơm';
    default:
      return device;
  }
};

// Hiển thị ngày trong tuần - Memoized
const formatDays = (days) => {
  if (!days || days.length === 0) {
    return 'Không có ngày nào';
  }
  
  if (days.length === 7) {
    return 'Hàng ngày';
  }
  
  return days
    .map((day) => DAYS_OF_WEEK.find((d) => d.value === day)?.label || '')
    .filter(Boolean)
    .join(', ');
};

// Component EmptySchedule - sử dụng memo
const EmptySchedule = memo(({ onAddClick }) => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="h6" color="text.secondary" gutterBottom>
      Chưa có lịch trình nào
    </Typography>
    <Typography variant="body2" color="text.secondary" paragraph>
      Tạo lịch trình để tự động điều khiển thiết bị theo thời gian
    </Typography>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={onAddClick}
      sx={{ mt: 2 }}
    >
      Thêm lịch trình
    </Button>
  </Box>
));

// Component ActionChip - sử dụng memo
const ActionChip = memo(({ action }) => (
  <Chip 
    label={action ? 'BẬT' : 'TẮT'} 
    color={action ? 'success' : 'error'} 
    size="small" 
  />
));

// Component ScheduleTableRow - sử dụng memo
const ScheduleTableRow = memo(({ schedule, onEdit, onDelete, onToggle }) => {
  // Sử dụng ID phù hợp (hỗ trợ cả 2 định dạng id và _id)
  const scheduleId = schedule.id || schedule._id;
  
  // Hiển thị thời gian, ưu tiên sử dụng time nếu có
  const displayTime = useMemo(() => {
    return schedule.time || formatTime(schedule.hour, schedule.minute);
  }, [schedule.time, schedule.hour, schedule.minute]);
  
  // Định dạng ngày
  const formattedDays = useMemo(() => {
    return schedule.days_text || formatDays(schedule.days);
  }, [schedule.days_text, schedule.days]);
  
  // Callbacks
  const handleToggle = useCallback((e) => {
    onToggle(scheduleId, e.target.checked);
  }, [onToggle, scheduleId]);
  
  const handleEdit = useCallback(() => {
    onEdit(schedule);
  }, [onEdit, schedule]);
  
  const handleDelete = useCallback(() => {
    onDelete(schedule);
  }, [onDelete, schedule]);
  
  return (
    <TableRow>
      <TableCell>{displayTime}</TableCell>
      <TableCell>{getDeviceName(schedule.device)}</TableCell>
      <TableCell>
        <ActionChip action={schedule.action} />
      </TableCell>
      <TableCell>{formattedDays}</TableCell>
      <TableCell>
        <Switch
          checked={schedule.active}
          onChange={handleToggle}
          color="primary"
        />
      </TableCell>
      <TableCell align="right">
        <IconButton
          size="small"
          onClick={handleEdit}
          sx={{ mr: 1 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleDelete}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
});

// Component ScheduleTable - sử dụng memo
const ScheduleTable = memo(({ schedules, onEdit, onDelete, onToggle }) => (
  <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Thời gian</TableCell>
          <TableCell>Thiết bị</TableCell>
          <TableCell>Hành động</TableCell>
          <TableCell>Các ngày</TableCell>
          <TableCell>Trạng thái</TableCell>
          <TableCell align="right">Thao tác</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {schedules.map((schedule) => (
          <ScheduleTableRow 
            key={schedule.id || schedule._id}
            schedule={schedule}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
          />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
));

// Component DaySelector - sử dụng memo
const DaySelector = memo(({ days, onToggle, error }) => (
  <Grid item xs={12}>
    <Typography variant="subtitle2" gutterBottom>
      Chọn ngày
    </Typography>
    <FormGroup row>
      {DAYS_OF_WEEK.map((day) => {
        const isChecked = days.includes(day.value);
        const handleChange = () => onToggle(day.value);
        
        return (
          <FormControlLabel
            key={day.value}
            control={
              <Checkbox
                checked={isChecked}
                onChange={handleChange}
                name={`day-${day.value}`}
              />
            }
            label={day.label}
          />
        );
      })}
    </FormGroup>
    {error && (
      <FormHelperText error>{error}</FormHelperText>
    )}
  </Grid>
));

// Component ScheduleDialog - sử dụng memo
const ScheduleDialog = memo(({ 
  open, 
  onClose, 
  formData, 
  formErrors, 
  onInputChange, 
  onSwitchChange, 
  onDayToggle, 
  onSave, 
  saving, 
  isEdit 
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>
      {isEdit ? 'Chỉnh sửa lịch trình' : 'Thêm lịch trình mới'}
    </DialogTitle>
    <DialogContent>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="device-label">Thiết bị</InputLabel>
            <Select
              labelId="device-label"
              id="device"
              name="device"
              value={formData.device}
              onChange={onInputChange}
              label="Thiết bị"
            >
              <MenuItem value="FAN">Quạt</MenuItem>
              <MenuItem value="LIGHT">Đèn</MenuItem>
              <MenuItem value="PUMP">Máy bơm</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="action-label">Hành động</InputLabel>
            <Select
              labelId="action-label"
              id="action"
              name="action"
              value={formData.action}
              onChange={onInputChange}
              label="Hành động"
            >
              <MenuItem value={true}>Bật thiết bị</MenuItem>
              <MenuItem value={false}>Tắt thiết bị</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Giờ"
            name="hour"
            type="number"
            value={formData.hour}
            onChange={onInputChange}
            InputProps={{ inputProps: { min: 0, max: 23 } }}
            error={!!formErrors.hour}
            helperText={formErrors.hour}
          />
        </Grid>
        
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Phút"
            name="minute"
            type="number"
            value={formData.minute}
            onChange={onInputChange}
            InputProps={{ inputProps: { min: 0, max: 59 } }}
            error={!!formErrors.minute}
            helperText={formErrors.minute}
          />
        </Grid>
        
        <DaySelector 
          days={formData.days} 
          onToggle={onDayToggle}
          error={formErrors.days}
        />
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.active}
                onChange={onSwitchChange}
                name="active"
              />
            }
            label="Kích hoạt lịch trình"
          />
        </Grid>
      </Grid>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={saving}>
        Hủy
      </Button>
      <Button
        variant="contained"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? <CircularProgress size={24} /> : 'Lưu'}
      </Button>
    </DialogActions>
  </Dialog>
));

// Component DeleteDialog - sử dụng memo
const DeleteDialog = memo(({ open, onCancel, onConfirm, loading }) => (
  <Dialog
    open={open}
    onClose={onCancel}
  >
    <DialogTitle>
      Xóa lịch trình
    </DialogTitle>
    <DialogContent>
      <DialogContentText>
        Bạn có chắc chắn muốn xóa lịch trình này?
        Hành động này không thể hoàn tác.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} disabled={loading}>
        Hủy
      </Button>
      <Button 
        onClick={onConfirm} 
        color="error" 
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Xóa'}
      </Button>
    </DialogActions>
  </Dialog>
));

// Component chính
const ScheduleList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [garden, setGarden] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    device: 'FAN',
    action: true,
    hour: 0,
    minute: 0,
    days: [0, 1, 2, 3, 4, 5, 6], // Mặc định mỗi ngày
    active: true,
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  // Fetch data - useCallback để tối ưu
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Lấy thông tin vườn
      const gardenResponse = await getGardenById(id);
      setGarden(gardenResponse.garden);
      
      // Lấy danh sách lịch trình
      const schedulesResponse = await getSchedules(id);
      console.log('Phản hồi đã xử lý từ API schedules:', schedulesResponse);
      
      // Xử lý phản hồi một cách nhất quán
      let scheduleList = [];
      if (schedulesResponse.success) {
        scheduleList = schedulesResponse.data?.schedules || [];
        console.log(`Đã tìm thấy ${scheduleList.length} lịch trình (định dạng mới)`);
      } else if (schedulesResponse.schedules) {
        scheduleList = schedulesResponse.schedules || [];
        console.log(`Đã tìm thấy ${scheduleList.length} lịch trình (định dạng cũ)`);
      } else if (Array.isArray(schedulesResponse)) {
        scheduleList = schedulesResponse;
        console.log(`Đã tìm thấy ${schedulesResponse.length} lịch trình (mảng trực tiếp)`);
      } else {
        // Trường hợp phản hồi không đúng định dạng
        console.warn('Định dạng phản hồi API không nhận dạng được:', schedulesResponse);
        scheduleList = [];
      }
      setSchedules(scheduleList);
      
      // Lấy trạng thái AUTO
      try {
        const { getDevicesStatus } = await import('../services/deviceService');
        const deviceStatusResponse = await getDevicesStatus(id);
        
        // Kiểm tra kỹ lưỡng để tránh lỗi undefined
        if (deviceStatusResponse && deviceStatusResponse.success && 
            deviceStatusResponse.devices && deviceStatusResponse.devices.auto === false) {
          // Hiển thị thông báo nếu chế độ lịch trình đang bị vô hiệu hóa
          toast.info('Lịch trình tự động đang bị VÔ HIỆU HÓA. Các lịch trình đã cài đặt sẽ không được thực thi cho đến khi bạn bật lại chức năng này ở trang Dashboard.');
        }
      } catch (deviceError) {
        console.error('Lỗi khi lấy trạng thái thiết bị:', deviceError);
        // Không cần hiển thị lỗi này cho người dùng, chỉ log ra console
      }
      
      setError(null);
    } catch (err) {
      console.error('Chi tiết lỗi khi tải dữ liệu:', err);
      setError(err.message || 'Lỗi khi tải dữ liệu');
      toast.error('Không thể tải dữ liệu lịch trình');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  // Khởi tạo formData mặc định - useMemo để tối ưu
  const defaultFormData = useMemo(() => ({
    device: 'FAN',
    action: true,
    hour: 0,
    minute: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    active: true,
  }), []);
  
  // Mở dialog thêm/chỉnh sửa - useCallback để tối ưu
  const handleOpenDialog = useCallback((schedule = null) => {
    if (schedule) {
      // Chỉnh sửa lịch trình hiện có
      setSelectedSchedule(schedule);
      
      // Xử lý trường hợp schedule.time tồn tại nhưng hour và minute không
      let hour = schedule.hour;
      let minute = schedule.minute;
      
      // Nếu có time nhưng không có hour/minute, thử phân tích từ time
      if (schedule.time && (hour === undefined || minute === undefined)) {
        try {
          const timeParts = schedule.time.split(':');
          if (timeParts.length === 2) {
            hour = parseInt(timeParts[0], 10);
            minute = parseInt(timeParts[1], 10);
          }
        } catch (error) {
          console.error('Lỗi khi phân tích thời gian:', error);
          hour = 0;
          minute = 0;
        }
      }
      
      setFormData({
        device: schedule.device,
        action: schedule.action,
        hour: hour !== undefined ? hour : 0,
        minute: minute !== undefined ? minute : 0,
        days: schedule.days || [0, 1, 2, 3, 4, 5, 6],
        active: schedule.active,
      });
    } else {
      // Tạo lịch trình mới
      setSelectedSchedule(null);
      setFormData(defaultFormData);
    }
    setFormErrors({});
    setOpenDialog(true);
  }, [defaultFormData]);
  
  // Đóng dialog - useCallback để tối ưu
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);
  
  // Xử lý thay đổi input - useCallback để tối ưu
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Xóa lỗi khi người dùng bắt đầu nhập lại
    setFormErrors(prev => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);
  
  // Xử lý thay đổi switch - useCallback để tối ưu
  const handleSwitchChange = useCallback((e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  }, []);
  
  // Xử lý toggle ngày - useCallback để tối ưu
  const handleDayToggle = useCallback((day) => {
    setFormData(prev => {
      const currentDays = [...prev.days];
      const dayIndex = currentDays.indexOf(day);
      
      if (dayIndex === -1) {
        currentDays.push(day);
      } else {
        currentDays.splice(dayIndex, 1);
      }
      
      return {
        ...prev,
        days: currentDays,
      };
    });
    
    // Xóa lỗi khi người dùng bắt đầu nhập lại
    setFormErrors(prev => {
      if (prev.days) {
        const newErrors = { ...prev };
        delete newErrors.days;
        return newErrors;
      }
      return prev;
    });
  }, []);
  
  // Kiểm tra biểu mẫu - useCallback để tối ưu
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (formData.hour < 0 || formData.hour > 23) {
      errors.hour = 'Giờ phải từ 0-23';
    }
    
    if (formData.minute < 0 || formData.minute > 59) {
      errors.minute = 'Phút phải từ 0-59';
    }
    
    if (formData.days.length === 0) {
      errors.days = 'Chọn ít nhất một ngày trong tuần';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);
  
  // Lưu lịch trình - useCallback để tối ưu
  const handleSaveSchedule = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaveLoading(true);
      
      if (selectedSchedule) {
        // Cập nhật lịch trình hiện có
        const scheduleId = selectedSchedule.id || selectedSchedule._id;
        await updateSchedule(id, scheduleId, formData);
        toast.success('Lịch trình đã được cập nhật');
      } else {
        // Tạo lịch trình mới
        await createSchedule(id, formData);
        toast.success('Lịch trình mới đã được tạo');
      }
      
      // Cập nhật lại danh sách lịch trình
      const schedulesResponse = await getSchedules(id);
      
      // Sử dụng cùng logic xử lý từ fetchData
      let scheduleList = [];
      if (schedulesResponse.success) {
        scheduleList = schedulesResponse.data?.schedules || [];
      } else if (schedulesResponse.schedules) {
        scheduleList = schedulesResponse.schedules || [];
      } else if (Array.isArray(schedulesResponse)) {
        scheduleList = schedulesResponse;
      }
      setSchedules(scheduleList);
      
      handleCloseDialog();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu lịch trình');
    } finally {
      setSaveLoading(false);
    }
  }, [validateForm, selectedSchedule, formData, id, handleCloseDialog]);
  
  // Bật/tắt lịch trình - useCallback để tối ưu
  const handleToggleSchedule = useCallback(async (scheduleId, active) => {
    try {
      await toggleSchedule(id, scheduleId, active);
      
      // Cập nhật lại danh sách lịch trình
      setSchedules(prevSchedules => prevSchedules.map((schedule) => {
        if ((schedule._id === scheduleId) || (schedule.id === scheduleId)) {
          return { ...schedule, active };
        }
        return schedule;
      }));
      
      toast.success(`Lịch trình đã được ${active ? 'kích hoạt' : 'vô hiệu hóa'}`);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi thay đổi trạng thái lịch trình');
    }
  }, [id]);
  
  // Mở dialog xác nhận xóa - useCallback để tối ưu
  const handleDeleteClick = useCallback((schedule) => {
    setSelectedSchedule(schedule);
    setDeleteDialogOpen(true);
  }, []);
  
  // Đóng dialog xác nhận xóa - useCallback để tối ưu
  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);
  
  // Xác nhận xóa lịch trình - useCallback để tối ưu
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedSchedule) return;
    
    try {
      setDeleteLoading(true);
      const scheduleId = selectedSchedule.id || selectedSchedule._id;
      await deleteSchedule(id, scheduleId);
      
      // Cập nhật lại danh sách lịch trình trong state
      setSchedules(prevSchedules => prevSchedules.filter(
        (schedule) => (schedule._id !== scheduleId && schedule.id !== scheduleId)
      ));
      
      setDeleteDialogOpen(false);
      toast.success('Lịch trình đã được xóa');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa lịch trình');
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedSchedule, id]);
  
  // Fetch data khi mount hoặc thay đổi id
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Hiển thị loading
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Hiển thị lỗi
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }
  
  // Kiểm tra vườn
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
        <Typography color="text.primary">Lịch trình</Typography>
      </Breadcrumbs>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton component={RouterLink} to={`/gardens/${id}`} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Lịch trình
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm lịch trình
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          {schedules.length === 0 ? (
            <EmptySchedule onAddClick={() => handleOpenDialog()} />
          ) : (
            <ScheduleTable 
              schedules={schedules}
              onEdit={handleOpenDialog}
              onDelete={handleDeleteClick}
              onToggle={handleToggleSchedule}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Dialog thêm/chỉnh sửa lịch trình */}
      <ScheduleDialog
        open={openDialog}
        onClose={handleCloseDialog}
        formData={formData}
        formErrors={formErrors}
        onInputChange={handleInputChange}
        onSwitchChange={handleSwitchChange}
        onDayToggle={handleDayToggle}
        onSave={handleSaveSchedule}
        saving={saveLoading}
        isEdit={!!selectedSchedule}
      />
      
      {/* Dialog xác nhận xóa */}
      <DeleteDialog
        open={deleteDialogOpen}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </Box>
  );
};

export default memo(ScheduleList); 