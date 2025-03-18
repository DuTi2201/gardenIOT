import React, { useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Skeleton,
  alpha,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';

/**
 * Component hiển thị thống kê với biểu đồ mini
 * @param {Object} props
 * @param {string} props.title - Tiêu đề của thẻ
 * @param {string|number} props.value - Giá trị chính hiển thị
 * @param {string} props.unit - Đơn vị của giá trị
 * @param {string} props.subtitle - Dòng chữ phụ (ví dụ: % thay đổi)
 * @param {number} props.changePercent - Phần trăm thay đổi
 * @param {array} props.chartData - Dữ liệu cho biểu đồ mini
 * @param {string} props.icon - Icon hoặc component để hiển thị
 * @param {object} props.chartOptions - Tùy chọn cho biểu đồ
 * @param {string} props.iconColor - Màu cho icon
 * @param {string} props.bgColor - Màu nền cho card
 * @param {boolean} props.loading - Trạng thái loading
 * @param {function} props.onMoreClick - Callback khi nhấn nút "more"
 */
const StatisticsCard = ({
  title,
  value,
  unit = '',
  subtitle = '',
  changePercent = 0,
  chartData,
  icon: IconComponent,
  chartOptions = {},
  iconColor = 'primary.main',
  bgColor = '#ffffff',
  loading = false,
  onMoreClick
}) => {
  const theme = useTheme();

  // Memoize styles để tránh tính toán lại trong mỗi lần render
  const styles = useMemo(() => ({
    card: {
      backgroundImage: `linear-gradient(to right, ${bgColor}, ${alpha(bgColor, 0.8)})`,
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.3s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
      }
    },
    iconContainer: {
      position: 'absolute',
      top: -10,
      right: -10,
      width: 80,
      height: 80,
      borderRadius: '50%',
      backgroundColor: alpha(theme.palette[iconColor.split('.')[0]][iconColor.split('.')[1] || 'main'], 0.15),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.7,
    },
    chartContainer: {
      position: 'absolute',
      bottom: -5,
      left: 0,
      right: 0,
      height: 60,
      opacity: 0.5,
      pointerEvents: 'none',
    }
  }), [bgColor, theme, iconColor]);

  // Default chart options with good performance settings
  const defaultChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false
        }
      },
      y: {
        display: false,
        grid: {
          display: false
        }
      }
    },
    elements: {
      line: {
        tension: 0.5,
        borderWidth: 2,
        borderColor: theme.palette.primary.main,
        fill: 'start',
        backgroundColor: alpha(theme.palette.primary.main, 0.1)
      },
      point: {
        radius: 0,
        hitRadius: 0
      }
    },
    animation: false
  }), [theme]);

  // Merge default options with custom options
  const mergedChartOptions = useMemo(() => ({
    ...defaultChartOptions,
    ...chartOptions,
    elements: {
      ...defaultChartOptions.elements,
      ...(chartOptions.elements || {})
    }
  }), [defaultChartOptions, chartOptions]);

  // Memoize chart data to avoid recreation on each render
  const memoizedChartData = useMemo(() => {
    if (!chartData) return null;
    
    return {
      ...chartData,
      datasets: chartData.datasets.map(dataset => ({
        ...dataset,
        borderColor: dataset.borderColor || theme.palette.primary.main,
        backgroundColor: dataset.backgroundColor || alpha(theme.palette.primary.main, 0.1)
      }))
    };
  }, [chartData, theme]);

  // Get trend icon based on change percent
  const TrendIcon = useMemo(() => {
    if (changePercent > 0) return TrendingUp;
    if (changePercent < 0) return TrendingDown;
    return TrendingFlat;
  }, [changePercent]);

  // Get color based on change percent
  const trendColor = useMemo(() => {
    if (changePercent > 0) return theme.palette.success.main;
    if (changePercent < 0) return theme.palette.error.main;
    return theme.palette.text.secondary;
  }, [changePercent, theme]);

  // Handle more click with useCallback
  const handleMoreClick = useCallback((e) => {
    if (onMoreClick) {
      onMoreClick(e);
    }
  }, [onMoreClick]);

  // Format number with commas
  const formatNumber = useMemo(() => {
    return new Intl.NumberFormat('vi-VN').format(value);
  }, [value]);

  return (
    <Card sx={styles.card}>
      {IconComponent && (
        <Box sx={styles.iconContainer}>
          <IconComponent
            sx={{
              fontSize: 32,
              color: theme.palette[iconColor.split('.')[0]][iconColor.split('.')[1] || 'main'],
            }}
          />
        </Box>
      )}

      <CardContent>
        {loading ? (
          <>
            <Skeleton width="40%" height={28} animation="wave" />
            <Skeleton width="70%" height={38} animation="wave" />
            <Skeleton width="50%" height={24} animation="wave" />
          </>
        ) : (
          <>
            <Typography 
              variant="subtitle2" 
              color="text.secondary" 
              sx={{ mb: 1, fontWeight: 500 }}
            >
              {title}
            </Typography>
            
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 0.5,
                lineHeight: 1.2 
              }}
            >
              {formatNumber}
              {unit && (
                <Typography 
                  component="span" 
                  variant="subtitle1" 
                  sx={{ ml: 0.5, opacity: 0.7 }}
                >
                  {unit}
                </Typography>
              )}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {changePercent !== undefined && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: trendColor,
                    backgroundColor: alpha(trendColor, 0.1),
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    mr: 1
                  }}
                >
                  <TrendIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                    {Math.abs(changePercent).toFixed(1)}%
                  </Typography>
                </Box>
              )}
              
              {subtitle && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ flex: 1 }}
                >
                  {subtitle}
                </Typography>
              )}
              
              {onMoreClick && (
                <IconButton 
                  size="small" 
                  onClick={handleMoreClick} 
                  sx={{ ml: 'auto' }}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </>
        )}
      </CardContent>

      {memoizedChartData && !loading && (
        <Box sx={styles.chartContainer}>
          <Line data={memoizedChartData} options={mergedChartOptions} />
        </Box>
      )}
    </Card>
  );
};

// Sử dụng React.memo để tránh re-render không cần thiết
export default React.memo(StatisticsCard); 