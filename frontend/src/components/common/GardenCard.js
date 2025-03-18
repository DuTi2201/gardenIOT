import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Box, 
  Chip, 
  Button, 
  IconButton, 
  alpha,
  useTheme,
  CardMedia,
  Grid,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Spa as SpaIcon,
  MoreVert as MoreVertIcon,
  Thermostat as ThermostatIcon,
  WaterDrop as WaterDropIcon,
  WbSunny as SunIcon,
  Grass as GrassIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  Grain as GrainIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

// Tách thành component riêng và dùng React.memo
const StatusChip = React.memo(({ status, theme }) => {
  // Xác định màu sắc dựa trên trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return theme.palette.success.main;
      case 'offline': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      default: return theme.palette.grey[500];
    }
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'online': return 'Hoạt động';
      case 'offline': return 'Ngoại tuyến';
      case 'warning': return 'Cảnh báo';
      default: return 'Không xác định';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <CheckIcon fontSize="small" />;
      case 'offline': return <WarningIcon fontSize="small" />;
      case 'warning': return <WarningIcon fontSize="small" />;
      default: return null;
    }
  };

  return (
    <Chip
      icon={getStatusIcon(status)}
      label={getStatusLabel(status)}
      size="small"
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        bgcolor: alpha(getStatusColor(status), 0.9),
        color: '#fff',
        fontWeight: 600,
        fontSize: { xs: '0.65rem', sm: '0.7rem' },
        height: { xs: 22, sm: 24 },
        '& .MuiChip-icon': {
          color: '#fff'
        }
      }}
    />
  );
});

StatusChip.displayName = 'StatusChip';

// Component hiển thị các thông số môi trường
const SensorDisplay = React.memo(({ icon, value, unit, color, theme }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      p: { xs: 0.75, sm: 1 },
      borderRadius: 1,
      bgcolor: alpha(theme.palette.primary.light, 0.05),
      mb: unit === '°C' || unit === '%' ? 1 : 0 // Margin dưới chỉ cho hàng đầu tiên
    }}>
      {React.cloneElement(icon, { 
        sx: { 
          fontSize: { xs: 18, sm: 20 }, 
          color: color, 
          mr: 0.5 
        }
      })}
      <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
        {value || '--'}{unit}
      </Typography>
    </Box>
  );
});

SensorDisplay.displayName = 'SensorDisplay';

// Component cho thanh CardActions
const GardenCardActions = React.memo(({ gardenId }) => {
  return (
    <CardActions 
      sx={{ 
        p: 0, 
        px: { xs: 1.5, sm: 2.5 }, 
        pt: 0, 
        justifyContent: 'space-between',
        mt: 'auto'
      }}
    >
      <Button 
        size="small" 
        color="primary" 
        component={RouterLink} 
        to={`/gardens/${gardenId}`}
        startIcon={<ViewIcon fontSize="small" />}
        sx={{ 
          textTransform: 'none',
          fontWeight: 600,
          fontSize: { xs: '0.75rem', sm: '0.8rem' }
        }}
      >
        Xem chi tiết
      </Button>
      
      <Button
        size="small"
        color="secondary"
        startIcon={<SettingsIcon fontSize="small" />}
        component={RouterLink}
        to={`/gardens/${gardenId}/settings`}
        sx={{ 
          textTransform: 'none',
          fontWeight: 600,
          fontSize: { xs: '0.75rem', sm: '0.8rem' }
        }}
      >
        Quản lý
      </Button>
    </CardActions>
  );
});

GardenCardActions.displayName = 'GardenCardActions';

const GardenCard = ({ garden, onSelect }) => {
  const theme = useTheme();
  
  // Memoize hàm format time để tránh tạo lại khi render
  const formatLastUpdate = useMemo(() => {
    return (timestamp) => {
      if (!timestamp) return 'Chưa có dữ liệu';
      
      const now = new Date();
      const updateTime = new Date(timestamp);
      const diffMs = now - updateTime;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ngày trước`;
    };
  }, []);
  
  // Memoize sensorsData để tránh tính toán lại
  const sensorsData = useMemo(() => [
    {
      icon: <ThermostatIcon />,
      value: garden.sensors?.temperature,
      unit: '°C',
      color: 'error.main',
      gridItem: { xs: 6, sm: 6 }
    },
    {
      icon: <WaterDropIcon />,
      value: garden.sensors?.humidity,
      unit: '%',
      color: 'info.main',
      gridItem: { xs: 6, sm: 6 }
    },
    {
      icon: <SunIcon />,
      value: garden.sensors?.light,
      unit: '%',
      color: 'warning.main',
      gridItem: { xs: 6, sm: 6 }
    },
    {
      icon: <GrassIcon />,
      value: garden.sensors?.soil,
      unit: '%',
      color: 'success.main',
      gridItem: { xs: 6, sm: 6 }
    }
  ], [garden.sensors]);
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-6px)' },
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.1)',
        },
        position: 'relative',
        pb: 2
      }}
    >
      {/* Garden cover image */}
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height={140}
          image={garden.image || 'https://source.unsplash.com/random?garden'}
          alt={garden.name}
          sx={{ 
            objectFit: 'cover',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        />
        
        {/* Status badge */}
        <StatusChip status={garden.status} theme={theme} />
      </Box>
      
      <CardContent sx={{ pt: 2, px: { xs: 2, sm: 3 }, pb: 1, flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.125rem' },
              mb: 0.5,
              color: theme.palette.text.primary,
            }}
          >
            {garden.name}
          </Typography>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: { xs: '2.5em', sm: '3em' },
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          {garden.description || 'Không có mô tả'}
        </Typography>
        
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {sensorsData.map((sensor, index) => (
            <Grid item {...sensor.gridItem} key={index}>
              <SensorDisplay
                icon={sensor.icon}
                value={sensor.value}
                unit={sensor.unit}
                color={sensor.color}
                theme={theme}
              />
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: { xs: '0.65rem', sm: '0.7rem' }
            }}
          >
            <ScheduleIcon sx={{ fontSize: { xs: 12, sm: 14 }, mr: 0.5, opacity: 0.7 }} />
            {formatLastUpdate(garden.lastUpdate)}
          </Typography>
          
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: { xs: '0.65rem', sm: '0.7rem' }
            }}
          >
            <GrainIcon sx={{ fontSize: { xs: 12, sm: 14 }, mr: 0.5, opacity: 0.7 }} />
            {garden.plantCount || 0} loại cây
          </Typography>
        </Box>
      </CardContent>
      
      <GardenCardActions gardenId={garden.id} />
    </Card>
  );
};

export default React.memo(GardenCard); 