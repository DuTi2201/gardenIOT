import React, { useMemo, useCallback } from 'react';
import {
  Paper,
  Box,
  Typography,
  Switch,
  CircularProgress,
  alpha,
  Chip,
  useTheme
} from '@mui/material';

/**
 * Component điều khiển thiết bị cho vườn thông minh
 * @param {Object} props
 * @param {string} props.id - ID của thiết bị
 * @param {string} props.name - Tên hiển thị của thiết bị
 * @param {React.ReactNode} props.icon - Icon của thiết bị
 * @param {string} props.iconColor - Mã màu của icon
 * @param {boolean} props.isActive - Trạng thái hoạt động của thiết bị
 * @param {boolean} props.isLoading - Trạng thái loading khi đang gửi lệnh
 * @param {boolean} props.disabled - Trạng thái vô hiệu hóa của điều khiển
 * @param {string} props.activeText - Văn bản hiển thị khi thiết bị đang hoạt động
 * @param {string} props.inactiveText - Văn bản hiển thị khi thiết bị không hoạt động
 * @param {function} props.onChange - Callback khi thiết bị được chuyển đổi
 * @param {Object} props.additionalInfo - Thông tin bổ sung để hiển thị (Optional)
 * @param {React.ReactNode} props.additionalControls - Các điều khiển bổ sung (Optional)
 * @param {string} props.status - Trạng thái của thiết bị ('success', 'warning', 'error', etc)
 */
const DeviceControl = ({
  id,
  name,
  icon,
  iconColor,
  isActive = false,
  isLoading = false,
  disabled = false,
  activeText = 'Đang hoạt động',
  inactiveText = 'Đã tắt',
  onChange,
  additionalInfo,
  additionalControls,
  status
}) => {
  const theme = useTheme();
  
  // Memoize styles để tránh tính toán lại trong mỗi lần render
  const containerStyles = useMemo(() => ({
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
    ...(isActive && {
      background: `linear-gradient(145deg, ${alpha(theme.palette.success.main, 0.08)}, ${alpha(theme.palette.success.main, 0.02)})`,
      borderColor: alpha(theme.palette.success.main, 0.3),
    })
  }), [isActive, theme.palette.success.main]);

  const iconContainerStyles = useMemo(() => ({
    width: 60,
    height: 60,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(iconColor, 0.1),
    color: iconColor,
    transition: 'all 0.3s ease',
    mb: 2,
    ...(isActive && {
      backgroundColor: alpha(iconColor, 0.2),
      transform: 'scale(1.05)',
    })
  }), [isActive, iconColor]);

  const handleChange = useCallback((event) => {
    if (!disabled && !isLoading && onChange) {
      onChange(event.target.checked);
    }
  }, [disabled, isLoading, onChange]);

  // Xác định màu sắc cho chip trạng thái
  const getStatusColor = useCallback((statusType) => {
    switch (statusType) {
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  }, [theme]);

  return (
    <Paper
      elevation={0}
      sx={containerStyles}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          {name}
        </Typography>
        
        {status && (
          <Chip
            label={isActive ? activeText : inactiveText}
            size="small"
            sx={{
              bgcolor: alpha(isActive ? getStatusColor('success') : theme.palette.grey[500], 0.1),
              color: isActive ? getStatusColor('success') : theme.palette.grey[600],
              fontWeight: 500,
              fontSize: '0.7rem',
              border: `1px solid ${alpha(isActive ? getStatusColor('success') : theme.palette.grey[500], 0.2)}`,
            }}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={iconContainerStyles}>
          {React.cloneElement(icon, { 
            sx: { 
              fontSize: 30, 
              animation: isActive ? 'pulse 2s infinite ease-in-out' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.7 },
                '100%': { opacity: 1 },
              }
            }
          })}
        </Box>
      </Box>

      {additionalInfo && (
        <Box sx={{ mb: 2 }}>
          {additionalInfo}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
        <Typography variant="body2" color="text.secondary">
          {isActive ? activeText : inactiveText}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isLoading ? (
            <CircularProgress size={24} thickness={5} />
          ) : (
            <Switch
              checked={isActive}
              onChange={handleChange}
              disabled={disabled}
              color="success"
              size="medium"
            />
          )}
        </Box>
      </Box>

      {additionalControls && (
        <Box sx={{ mt: 2 }}>
          {additionalControls}
        </Box>
      )}
    </Paper>
  );
};

export default React.memo(DeviceControl); 