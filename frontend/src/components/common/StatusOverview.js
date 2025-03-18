import React, { useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Divider,
  LinearProgress,
  Chip,
  IconButton,
  alpha,
  useTheme
} from '@mui/material';
import { 
  CheckCircle as CheckIcon,
  Cancel as ErrorIcon,
  Warning as WarningIcon,
  WifiTethering as SignalIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

/**
 * Component hiển thị tổng quan trạng thái hệ thống
 * @param {Object} props 
 * @param {string} props.title - Tiêu đề của card
 * @param {Array} props.items - Mảng các mục trạng thái
 * @param {string} props.connectionStatus - Trạng thái kết nối ('connected', 'disconnected', 'warning')
 * @param {number} props.overallHealth - Chỉ số sức khỏe tổng thể (0-100)
 * @param {boolean} props.loading - Trạng thái đang tải
 * @param {function} props.onRefresh - Callback khi nhấn nút refresh
 * @param {function} props.onMoreClick - Callback khi nhấn nút xem thêm
 */
const StatusOverview = ({
  title = 'Tổng quan trạng thái',
  items = [],
  connectionStatus = 'connected',
  overallHealth = 100,
  loading = false,
  onRefresh,
  onMoreClick
}) => {
  const theme = useTheme();
  
  // Memo hóa styles để tránh tính toán lại trong mỗi lần render
  const styles = useMemo(() => ({
    card: {
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      height: '100%',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      p: 2
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: 1
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center'
    },
    content: {
      p: 0,
      '&:last-child': {
        pb: 2
      }
    },
    itemList: {
      px: 2,
      py: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    },
    item: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    itemName: {
      display: 'flex',
      alignItems: 'center',
      gap: 1
    },
    itemStatus: {
      display: 'flex',
      alignItems: 'center'
    },
    healthSection: {
      px: 2,
      py: 1.5
    },
    healthText: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 1
    }
  }), []);

  // Memo hóa màu sắc health bar
  const healthBarColor = useMemo(() => {
    if (overallHealth >= 70) return theme.palette.success.main;
    if (overallHealth >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  }, [overallHealth, theme]);
  
  // Memo hóa thông tin và màu sắc trạng thái kết nối
  const connectionInfo = useMemo(() => {
    const info = {
      connected: {
        label: 'Đã kết nối',
        color: theme.palette.success.main,
        icon: <SignalIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
      },
      warning: {
        label: 'Kết nối không ổn định',
        color: theme.palette.warning.main,
        icon: <SignalIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
      },
      disconnected: {
        label: 'Mất kết nối',
        color: theme.palette.error.main,
        icon: <SignalIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
      }
    };
    
    return info[connectionStatus] || info.disconnected;
  }, [connectionStatus, theme]);
  
  // Callback xử lý sự kiện refresh
  const handleRefresh = useCallback((e) => {
    if (onRefresh) {
      onRefresh(e);
    }
  }, [onRefresh]);
  
  // Callback xử lý sự kiện more
  const handleMoreClick = useCallback((e) => {
    if (onMoreClick) {
      onMoreClick(e);
    }
  }, [onMoreClick]);
  
  // Hàm hiển thị icon trạng thái tương ứng
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'ok':
        return <CheckIcon fontSize="small" sx={{ color: theme.palette.success.main }} />;
      case 'warning':
        return <WarningIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />;
      case 'error':
        return <ErrorIcon fontSize="small" sx={{ color: theme.palette.error.main }} />;
      default:
        return null;
    }
  }, [theme]);
  
  // Memo hóa danh sách items để tối ưu hiệu suất
  const memoizedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      icon: getStatusIcon(item.status)
    }));
  }, [items, getStatusIcon]);

  return (
    <Card sx={styles.card}>
      <Box sx={styles.header}>
        <Box sx={styles.headerTitle}>
          <Typography variant="h6">{title}</Typography>
          <Chip
            size="small"
            icon={connectionInfo.icon}
            label={connectionInfo.label}
            sx={{
              backgroundColor: alpha(connectionInfo.color, 0.1),
              color: connectionInfo.color,
              fontWeight: 500,
              ml: 1
            }}
          />
        </Box>
        
        <Box sx={styles.headerActions}>
          <IconButton size="small" onClick={handleRefresh} disabled={loading}>
            <RefreshIcon 
              fontSize="small" 
              sx={{ 
                animation: loading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} 
            />
          </IconButton>
          
          <IconButton size="small" onClick={handleMoreClick}>
            <MoreIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <CardContent sx={styles.content}>
        <Divider />
        
        <Box sx={styles.itemList}>
          {memoizedItems.map((item, index) => (
            <Box key={item.id || index} sx={styles.item}>
              <Box sx={styles.itemName}>
                {item.icon}
                <Typography variant="body2">{item.name}</Typography>
              </Box>
              
              <Box sx={styles.itemStatus}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: item.textColor || 'text.secondary',
                    fontWeight: 500
                  }}
                >
                  {item.value}
                </Typography>
                {item.additionalInfo && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ ml: 0.5 }}
                  >
                    {item.additionalInfo}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
        
        <Divider />
        
        <Box sx={styles.healthSection}>
          <Box sx={styles.healthText}>
            <Typography variant="body2" fontWeight={500}>
              Sức khỏe hệ thống
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: healthBarColor,
                fontWeight: 'bold' 
              }}
            >
              {overallHealth}%
            </Typography>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={overallHealth} 
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(healthBarColor, 0.2),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: healthBarColor
              }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

// Sử dụng React.memo để tránh re-render không cần thiết
export default React.memo(StatusOverview); 