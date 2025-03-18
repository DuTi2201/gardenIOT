import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  Box, 
  Typography, 
  Chip, 
  alpha, 
  Skeleton,
  useTheme 
} from '@mui/material';

/**
 * Component hiển thị thông tin từ một cảm biến
 * @param {Object} props
 * @param {string} props.type - Loại cảm biến ('temperature', 'humidity', 'light', 'soil')
 * @param {number} props.value - Giá trị cảm biến
 * @param {React.ReactNode} props.icon - Icon hiển thị
 * @param {string} props.unit - Đơn vị đo ('°C', '%', etc)
 * @param {string} props.iconColor - Mã màu icon (#hex)
 * @param {string} props.iconBgColor - Màu nền icon (rgba)
 * @param {string} props.title - Tiêu đề cảm biến
 * @param {boolean} props.loading - Trạng thái loading
 * @param {Object} props.status - Thông tin trạng thái (optional)
 * @param {*} props.statusColor - Màu của trạng thái
 * @param {string} props.statusText - Chữ hiển thị cho status
 * @param {function} props.onClick - Hàm xử lý khi click vào card (optional)
 */
const SensorCard = ({ 
  type, 
  value, 
  icon, 
  unit = '', 
  iconColor, 
  iconBgColor,
  title, 
  loading = false,
  status = null, 
  statusColor = 'primary.main',
  statusText = 'Bình thường',
  onClick = null 
}) => {
  const theme = useTheme();

  // Memoize styles để tránh tính toán lại trong mỗi lần render
  const cardStyles = useMemo(() => ({
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
    cursor: onClick ? 'pointer' : 'default'
  }), [onClick]);

  const iconContainerStyles = useMemo(() => ({
    width: { xs: 40, sm: 48 },
    height: { xs: 40, sm: 48 },
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: iconBgColor,
    mr: 2
  }), [iconBgColor]);

  const iconStyles = useMemo(() => ({ 
    color: iconColor, 
    fontSize: { xs: 24, sm: 28 }
  }), [iconColor]);

  const statusStyles = useMemo(() => ({
    position: 'absolute',
    top: 12,
    right: 12,
    bgcolor: alpha(statusColor, 0.9),
    color: '#fff',
    fontWeight: 500,
    fontSize: '0.7rem',
    '& .MuiChip-label': {
      px: 1
    }
  }), [statusColor]);

  // Formatting the value based on its type
  const formattedValue = useMemo(() => {
    if (loading) return null;
    
    if (type === 'temperature') {
      return parseFloat(value).toFixed(1);
    }
    return value;
  }, [type, value, loading]);
  
  return (
    <Card 
      sx={cardStyles}
      onClick={onClick}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={iconContainerStyles}>
            {React.cloneElement(icon, { sx: iconStyles })}
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
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={80} height={40} />
            ) : (
              <Typography 
                variant="h4" 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                {formattedValue}<span style={{ fontSize: '1rem' }}>{unit}</span>
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Status indicator */}
        {status && (
          <Chip 
            label={statusText}
            size="small"
            sx={statusStyles}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(SensorCard); 