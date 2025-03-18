import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { Line as ChartLine, Bar as ChartBar } from 'react-chartjs-2';

/**
 * Component biểu đồ với khả năng chuyển đổi giữa biểu đồ đường và cột
 * @param {Object} props
 * @param {object} props.data - Dữ liệu cho biểu đồ theo format Chart.js
 * @param {string} props.title - Tiêu đề của biểu đồ
 * @param {boolean} props.loading - Trạng thái đang tải dữ liệu
 * @param {function} props.onPeriodChange - Callback khi thay đổi khoảng thời gian
 * @param {function} props.onTypeChange - Callback khi thay đổi loại biểu đồ
 * @param {string} props.defaultPeriod - Khoảng thời gian mặc định ('24h', '7d', '30d')
 * @param {string} props.defaultType - Loại biểu đồ mặc định ('line', 'bar')
 * @param {array} props.periods - Các khoảng thời gian có thể chọn
 * @param {object} props.lineOptions - Tùy chọn cho biểu đồ đường
 * @param {object} props.barOptions - Tùy chọn cho biểu đồ cột
 */
const ChartPanel = ({
  data,
  title = 'Biểu đồ dữ liệu',
  loading = false,
  onPeriodChange,
  onTypeChange,
  defaultPeriod = '24h',
  defaultType = 'line',
  periods = [
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' }
  ],
  lineOptions = {},
  barOptions = {}
}) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState(defaultType);
  const [chartPeriod, setChartPeriod] = useState(defaultPeriod);

  // Memoize styles để tránh tính toán lại trong mỗi lần render
  const cardStyles = useMemo(() => ({
    borderRadius: 2,
    overflow: 'hidden',
    height: '100%',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
  }), []);

  // Default options for the charts
  const defaultLineOptions = useMemo(() => ({
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
        text: `${title} ${chartPeriod === '7d' ? '7 ngày' : chartPeriod === '30d' ? '30 ngày' : '24 giờ'} qua`,
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
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 10,
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)'
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          font: {
            size: 10
          },
          color: theme.palette.text.secondary
        }
      },
      y: {
        grid: {
          color: theme.palette.divider,
          drawBorder: false
        },
        ticks: {
          font: {
            size: 10
          },
          color: theme.palette.text.secondary
        }
      }
    },
    elements: {
      line: {
        tension: 0.3
      },
      point: {
        radius: 2,
        hoverRadius: 4
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }), [theme, title, chartPeriod]);

  // Merge the default options with the provided options
  const mergedLineOptions = useMemo(() => ({
    ...defaultLineOptions,
    ...lineOptions,
    plugins: {
      ...defaultLineOptions.plugins,
      ...(lineOptions.plugins || {})
    }
  }), [defaultLineOptions, lineOptions]);

  const mergedBarOptions = useMemo(() => ({
    ...defaultLineOptions,
    ...barOptions,
    plugins: {
      ...defaultLineOptions.plugins,
      ...(barOptions.plugins || {})
    }
  }), [defaultLineOptions, barOptions]);

  // Handle chart type change
  const handleChangeChartType = useCallback((_, newType) => {
    if (newType !== null) {
      setChartType(newType);
      if (onTypeChange) {
        onTypeChange(newType);
      }
    }
  }, [onTypeChange]);

  // Handle chart period change
  const handleChartPeriodChange = useCallback((_, newPeriod) => {
    if (newPeriod !== null) {
      setChartPeriod(newPeriod);
      if (onPeriodChange) {
        onPeriodChange(newPeriod);
      }
    }
  }, [onPeriodChange]);

  return (
    <Card sx={cardStyles}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 3 
        }}>
          <Typography variant="h6" sx={{ mb: { xs: 2, sm: 0 } }}>
            {title}
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: { xs: 1, sm: 2 }, 
            width: { xs: '100%', sm: 'auto' } 
          }}>
            {/* Chart type selector */}
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

            {/* Period selector */}
            <ToggleButtonGroup
              value={chartPeriod}
              exclusive
              onChange={handleChartPeriodChange}
              size="small"
              sx={{ display: 'flex', flexWrap: 'wrap' }}
            >
              {periods.map(period => (
                <ToggleButton 
                  key={period.value} 
                  value={period.value} 
                  sx={{ px: { xs: 1, sm: 2 } }}
                >
                  {period.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Box sx={{ height: { xs: 250, sm: 300, md: 400 }, position: 'relative' }}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              <CircularProgress size={40} sx={{ color: theme.palette.primary.main }} />
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
              {data ? (
                chartType === 'line' ? (
                  <ChartLine data={data} options={mergedLineOptions} />
                ) : (
                  <ChartBar data={data} options={mergedBarOptions} />
                )
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%',
                  color: 'text.secondary'
                }}>
                  <Typography variant="body2">Không có dữ liệu</Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default React.memo(ChartPanel); 