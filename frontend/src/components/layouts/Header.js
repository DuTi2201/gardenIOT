import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  useTheme,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  alpha,
  Tooltip,
  Chip,
  Divider,
  styled,
  keyframes,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  CloudDone as CloudDoneIcon,
  WbSunny as WbSunnyIcon,
  NotificationsOff as NotificationsOffIcon,
  MarkChatRead as MarkReadIcon,
  DeleteSweep as ClearAllIcon,
  Spa as SpaIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  NotificationsActive as NotificationsActiveIcon,
  WaterDrop as WaterDropIcon,
  CheckCircle as CheckCircleIcon,
  NotificationsNone as NotificationsNoneIcon,
  DoDisturbOn as DoNotDisturbIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import AnimatedMascot from '../common/AnimatedMascot';

// Tối ưu keyframes bằng cách cung cấp chúng như các biến hằng số (định nghĩa một lần)
const ANIMATIONS = {
  // Bounce keyframe animation
  bounce: keyframes`
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  `,

  // Pulse keyframe animation
  pulse: keyframes`
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  `,

  // Flash animation for new notification
  flash: keyframes`
    0%, 50%, 100% {
      opacity: 1;
    }
    25%, 75% {
      opacity: 0.6;
    }
  `,

  // Bell shake animation
  shake: keyframes`
    0%, 100% {
      transform: rotate(0);
    }
    20%, 60% {
      transform: rotate(8deg);
    }
    40%, 80% {
      transform: rotate(-8deg);
    }
  `
};

// Glassmorphism AppBar
const GlassAppBar = styled(AppBar)(({ theme }) => ({
  backdropFilter: 'blur(10px)',
  backgroundColor: alpha(theme.palette.background.paper, 0.85),
  borderBottom: '1px solid',
  borderColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.text.primary,
  boxShadow: 'rgba(0, 0, 0, 0.03) 0px 8px 24px',
  transition: 'all 0.3s ease',
  position: 'sticky',
}));

// Weather Chip styled component
const WeatherChip = styled(Chip)(({ theme }) => ({
  background: 'linear-gradient(135deg, #81C784 0%, #A5D6A7 100%)',
  color: '#fff',
  fontWeight: 600,
  borderRadius: '20px',
  padding: '0 5px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  border: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
  },
}));

// Styled SearchBar
const SearchBar = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '20px',
  backgroundColor: alpha(theme.palette.common.white, 0.75),
  border: '1px solid',
  borderColor: alpha(theme.palette.primary.main, 0.1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.95),
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
    borderColor: alpha(theme.palette.primary.main, 0.2),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  maxWidth: '320px',
  transition: 'all 0.3s ease',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

// Search Icon Wrapper
const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: alpha(theme.palette.primary.main, 0.7),
}));

// Styled Input - for the search
const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));

// Animated IconButton with feedback
const AnimatedIconButton = styled(IconButton)(({ theme }) => ({
  position: 'relative',
  transition: 'all 0.2s ease',
  background: alpha(theme.palette.primary.main, 0.05),
  marginLeft: theme.spacing(1),
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.1),
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
  '&:hover::after': {
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

// Hàm tiện ích lấy màu dựa vào loại thông báo - được di chuyển ra ngoài để không tạo lại mỗi lần render
const getTypeColor = (type, theme) => {
  switch (type) {
    case 'garden':
    case 'sensor':
      return theme.palette.error.light;
    case 'weather':
      return theme.palette.info.light;
    case 'watering':
      return theme.palette.primary.light;
    case 'schedule':
      return theme.palette.secondary.light;
    case 'success':
      return theme.palette.success.light;
    default:
      return theme.palette.grey[300];
  }
};

// Notification item with animation
const NotificationItem = styled(ListItem)(({ theme, isNew, notificationType }) => {
  return {
    padding: theme.spacing(1.5, 2),
    borderLeft: '4px solid',
    borderColor: getTypeColor(notificationType, theme),
    backgroundColor: isNew ? alpha(getTypeColor(notificationType, theme), 0.08) : 'transparent',
    animation: isNew ? `${ANIMATIONS.flash} 2s ease-in-out` : 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: alpha(getTypeColor(notificationType, theme), 0.12),
    },
    position: 'relative',
    overflow: 'hidden',
    '&::after': isNew ? {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: getTypeColor(notificationType, theme),
      margin: '8px',
    } : {},
  };
});

// Badge with bell shake animation
const AnimatedBadge = styled(Badge)(({ theme, hasNew }) => ({
  '& .MuiBadge-badge': {
    animation: hasNew ? `${ANIMATIONS.shake} 1s cubic-bezier(.36,.07,.19,.97) both` : 'none',
    transformOrigin: '50% 0',
  },
}));

// Notification icon based on type
const getNotificationIcon = (type, theme) => {
  switch (type) {
    case 'garden':
      return <SpaIcon sx={{ color: theme.palette.error.main }} />;
    case 'sensor':
      return <ErrorIcon sx={{ color: theme.palette.error.main }} />;
    case 'weather':
      return <WbSunnyIcon sx={{ color: theme.palette.info.main }} />;
    case 'watering':
      return <WaterDropIcon sx={{ color: theme.palette.primary.main }} />;
    case 'schedule':
      return <ScheduleIcon sx={{ color: theme.palette.secondary.main }} />;
    case 'system':
      return <InfoIcon sx={{ color: theme.palette.info.main }} />;
    case 'success':
      return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
    default:
      return <InfoIcon sx={{ color: theme.palette.grey[500] }} />;
  }
};

// Tách component để hiển thị biểu tượng thời tiết
const WeatherDisplay = React.memo(({ isSmallScreen }) => {
  if (isSmallScreen) {
    return (
      <Box>
        <WbSunnyIcon color="warning" fontSize="small" />
        <Typography variant="caption" sx={{ ml: 0.5 }}>28°C</Typography>
      </Box>
    );
  }
  
  return (
    <WeatherChip
      icon={<WbSunnyIcon sx={{ fontSize: 16 }} />}
      label="28°C Hà Nội"
      size="small"
      sx={{
        '& .MuiChip-label': {
          px: 1,
        },
      }}
    />
  );
});

WeatherDisplay.displayName = 'WeatherDisplay';

// Tách thành component SearchBox
const SearchBox = React.memo(({ fullWidth = false }) => {
  return (
    <SearchBar sx={fullWidth ? { width: '100%', maxWidth: 'none', mx: 0 } : {}}>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>
      <StyledInputBase
        placeholder="Tìm kiếm…"
        inputProps={{ 'aria-label': 'search' }}
        sx={fullWidth ? { width: '100%' } : {}}
      />
    </SearchBar>
  );
});

SearchBox.displayName = 'SearchBox';

// Component hiển thị logo và tên ứng dụng
const AppLogo = React.memo(() => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box component="img" src="/linh_vat_2.png" sx={{ height: 40, width: 40, mr: 1 }} />
      <Typography
        variant="h6"
        noWrap
        component="div"
        sx={{
          mr: 2,
          fontWeight: 600,
          background: 'linear-gradient(90deg, #2E7D32, #4CAF50)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Garden IoT
      </Typography>
    </Box>
  );
});

AppLogo.displayName = 'AppLogo';

// Component item thông báo đơn lẻ
const MemoizedNotificationItem = React.memo(({ notification, onClick, theme, formatNotificationTime }) => {
  return (
    <React.Fragment>
      <NotificationItem 
        isNew={!notification.read}
        notificationType={notification.type}
        onClick={() => onClick(notification)}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: 'transparent' }}>
            {getNotificationIcon(notification.type, theme)}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: notification.read ? 400 : 600,
                color: theme.palette.text.primary
              }}
            >
              {notification.title}
            </Typography>
          }
          secondary={
            <React.Fragment>
              <Typography 
                variant="body2" 
                component="span" 
                sx={{ 
                  display: 'block', 
                  color: theme.palette.text.secondary,
                  fontSize: '0.8rem',
                  mb: 0.5
                }}
              >
                {notification.message}
              </Typography>
              <Typography 
                variant="caption" 
                component="span" 
                sx={{ 
                  color: theme.palette.text.disabled,
                  fontStyle: 'italic'
                }}
              >
                {formatNotificationTime(notification.createdAt)}
              </Typography>
            </React.Fragment>
          }
        />
      </NotificationItem>
      <Divider variant="inset" component="li" />
    </React.Fragment>
  );
});

MemoizedNotificationItem.displayName = 'MemoizedNotificationItem';

// Component hiển thị khi không có thông báo
const EmptyNotifications = React.memo(() => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
    <Typography variant="body2" color="text.secondary">
      Không có thông báo nào
    </Typography>
  </Box>
));

EmptyNotifications.displayName = 'EmptyNotifications';

// Component Mascot helper
const MascotHelper = React.memo(({ isVisible, handleToggle, isSmallScreen, theme }) => {
  if (!isVisible) return null;
  
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 10, sm: 20 },
        right: { xs: 10, sm: 20 },
        zIndex: 1300,
        display: 'flex',
        alignItems: 'flex-end',
        animation: `${ANIMATIONS.bounce} 1s ease infinite`,
        maxWidth: { xs: '80%', sm: 'auto' },
      }}
    >
      <Box
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 3,
          p: { xs: 1.5, sm: 2 },
          maxWidth: { xs: 200, sm: 300 },
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.2),
          position: 'relative',
          mb: 1,
          mr: 2,
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -10,
            right: 20,
            width: 20,
            height: 20,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            transform: 'rotate(45deg)',
            borderRight: '1px solid',
            borderBottom: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.2),
          }
        }}
      >
        <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
          Chào bạn! Tôi là trợ lý vườn thông minh. Bạn cần giúp đỡ gì không?
        </Typography>
        <Button size="small" variant="outlined" sx={{ mr: 1, borderRadius: '20px', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
          Hướng dẫn
        </Button>
        <Button size="small" color="primary" sx={{ borderRadius: '20px', fontSize: { xs: '0.7rem', sm: '0.75rem' } }} onClick={handleToggle}>
          Đóng
        </Button>
      </Box>
      <AnimatedMascot size={isSmallScreen ? "small" : "medium"} animation="bounce" />
    </Box>
  );
});

MascotHelper.displayName = 'MascotHelper';

// Component phần header cho menu thông báo
const NotificationHeader = React.memo(({ unreadCount, handleMarkAllAsRead, handleClearAll, notifications }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <NotificationsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Thông báo {unreadCount > 0 && `(${unreadCount})`}
        </Typography>
      </Box>
      <Box>
        <Tooltip title="Đánh dấu tất cả là đã đọc">
          <IconButton size="small" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            <MarkReadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Xóa tất cả thông báo">
          <IconButton size="small" onClick={handleClearAll} disabled={notifications.length === 0}>
            <ClearAllIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
});

NotificationHeader.displayName = 'NotificationHeader';

// Component footer cho menu thông báo
const NotificationFooter = React.memo(({ navigate, handleCloseNotificationsMenu, handleCreateTestNotification }) => {
  return (
    <>
      <Box sx={{ p: 1.5, textAlign: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          size="small" 
          startIcon={<SettingsIcon />}
          onClick={() => {
            navigate('/settings/notifications');
            handleCloseNotificationsMenu();
          }}
          sx={{ 
            textTransform: 'none',
            borderRadius: '20px',
          }}
        >
          Cài đặt thông báo
        </Button>
        
        <Button 
          size="small" 
          startIcon={<DoNotDisturbIcon />}
          onClick={() => {
            // Toggle notification status
            handleCloseNotificationsMenu();
          }}
          color="warning"
          sx={{ 
            textTransform: 'none',
            borderRadius: '20px',
          }}
        >
          Tạm tắt thông báo
        </Button>
      </Box>
      
      {/* Development only */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ p: 1, textAlign: 'center', borderTop: '1px dashed', borderColor: 'divider' }}>
          <Button 
            size="small" 
            variant="outlined"
            onClick={handleCreateTestNotification}
            sx={{ 
              textTransform: 'none',
              borderRadius: '20px',
              fontSize: '0.7rem'
            }}
          >
            Tạo thông báo test (dev only)
          </Button>
        </Box>
      )}
    </>
  );
});

NotificationFooter.displayName = 'NotificationFooter';

// Component Menu Thông báo hoàn chỉnh
const NotificationsMenu = React.memo(({ 
  open, 
  anchorEl, 
  handleClose, 
  notifications, 
  unreadCount, 
  handleMarkAllAsRead, 
  handleClearAll, 
  handleNotificationClick, 
  formatNotificationTime, 
  navigate, 
  handleCreateTestNotification 
}) => {
  const theme = useTheme();

  // Memoize các props cho menu
  const menuProps = useMemo(() => ({
    id: "notifications-menu",
    anchorEl: anchorEl,
    keepMounted: true,
    open: open,
    onClose: handleClose,
    PaperProps: {
      sx: {
        width: { xs: '90vw', sm: 400 },
        maxWidth: { xs: '90vw', sm: 400 },
        maxHeight: { xs: '80vh', sm: 'auto' },
        mt: 1.5,
        borderRadius: 2,
        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'auto',
      },
    },
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'right',
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'right',
    }
  }), [anchorEl, open, handleClose]);

  // Memoize danh sách thông báo để tránh render lại nếu không thay đổi
  const notificationsList = useMemo(() => {
    return notifications.map((notification) => (
      <MemoizedNotificationItem
        key={notification.id}
        notification={notification}
        onClick={handleNotificationClick}
        theme={theme}
        formatNotificationTime={formatNotificationTime}
      />
    ));
  }, [notifications, handleNotificationClick, theme, formatNotificationTime]);

  return (
    <Menu {...menuProps}>
      <NotificationHeader 
        unreadCount={unreadCount} 
        handleMarkAllAsRead={handleMarkAllAsRead} 
        handleClearAll={handleClearAll} 
        notifications={notifications} 
      />
      
      <Divider />
      
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {notifications.length > 0 ? (
          <List sx={{ p: 0 }}>
            {notificationsList}
          </List>
        ) : (
          <EmptyNotifications />
        )}
      </Box>
      
      <Divider />
      
      <NotificationFooter 
        navigate={navigate} 
        handleCloseNotificationsMenu={handleClose} 
        handleCreateTestNotification={handleCreateTestNotification}
      />
    </Menu>
  );
});

NotificationsMenu.displayName = 'NotificationsMenu';

// Component Menu người dùng
const UserMenu = React.memo(({ 
  open, 
  anchorEl, 
  handleClose, 
  navigate, 
  handleLogout 
}) => {
  const menuProps = useMemo(() => ({
    id: "user-menu",
    anchorEl: anchorEl,
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'right',
    },
    keepMounted: true,
    transformOrigin: {
      vertical: 'top',
      horizontal: 'right',
    },
    open: open,
    onClose: handleClose,
    PaperProps: {
      sx: {
        mt: 1.5,
        borderRadius: 2,
        minWidth: 180,
        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
        border: '1px solid',
        borderColor: 'divider',
      },
    }
  }), [anchorEl, open, handleClose]);

  return (
    <Menu {...menuProps}>
      <Box sx={{ py: 1, px: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Người Dùng Garden
        </Typography>
        <Typography variant="body2" color="text.secondary">
          garden@example.com
        </Typography>
      </Box>
      
      <Divider />
      
      <MenuItem onClick={() => navigate('/profile')}>
        <PersonIcon fontSize="small" sx={{ mr: 1.5 }} />
        <Typography variant="body2">Hồ sơ của tôi</Typography>
      </MenuItem>
      
      <MenuItem onClick={() => navigate('/settings')}>
        <SettingsIcon fontSize="small" sx={{ mr: 1.5 }} />
        <Typography variant="body2">Cài đặt</Typography>
      </MenuItem>
      
      <Divider />
      
      <MenuItem onClick={handleLogout}>
        <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
        <Typography variant="body2">Đăng xuất</Typography>
      </MenuItem>
    </Menu>
  );
});

UserMenu.displayName = 'UserMenu';

// Component hành động/nút bên phải
const HeaderActions = React.memo(({ 
  isSmallScreen, 
  unreadCount, 
  hasNewNotification, 
  handleOpenNotificationsMenu, 
  colorMode, 
  toggleColorMode, 
  handleOpenUserMenu, 
  user 
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {/* Weather Chip for smaller screens */}
      {isSmallScreen && <WeatherDisplay isSmallScreen={true} />}

      {/* Notification Button */}
      <AnimatedIconButton
        size="large"
        aria-label="show notifications"
        color="inherit"
        onClick={handleOpenNotificationsMenu}
        sx={{
          animation: hasNewNotification ? `${ANIMATIONS.shake} 1s ease-in-out` : 'none',
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </AnimatedIconButton>

      {/* Mode Toggle Button */}
      <AnimatedIconButton
        size="large"
        aria-label="toggle dark mode"
        color="inherit"
        onClick={toggleColorMode}
      >
        {colorMode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
      </AnimatedIconButton>

      {/* User Menu */}
      <Tooltip title={user?.name || 'User Profile'}>
        <AnimatedIconButton
          size="large"
          edge="end"
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleOpenUserMenu}
          color="inherit"
        >
          <Avatar
            alt={user?.name || 'User'}
            src={user?.avatar || ''}
            sx={{
              width: 32,
              height: 32,
              border: '2px solid',
              borderColor: 'primary.light',
            }}
          />
        </AnimatedIconButton>
      </Tooltip>
    </Box>
  );
});

HeaderActions.displayName = 'HeaderActions';

// Header Component chính
const Header = ({ toggleColorMode, colorMode, handleDrawerToggle, isMobile }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAllNotifications,
    formatNotificationTime,
    createTestNotification 
  } = useNotifications();
  
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [showMascot, setShowMascot] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  
  // Sử dụng các hooks của Material UI
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Hiệu ứng rung chuông khi có thông báo mới
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotification(true);
      const timer = setTimeout(() => {
        setHasNewNotification(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [unreadCount, notifications]);

  // Memoize các hàm xử lý sự kiện để tránh tạo lại khi re-render
  const handleOpenUserMenu = useCallback((event) => {
    setAnchorElUser(event.currentTarget);
  }, []);

  const handleCloseUserMenu = useCallback(() => {
    setAnchorElUser(null);
  }, []);

  const handleOpenNotificationsMenu = useCallback((event) => {
    setAnchorElNotifications(event.currentTarget);
  }, []);

  const handleCloseNotificationsMenu = useCallback(() => {
    setAnchorElNotifications(null);
  }, []);

  const handleNotificationClick = useCallback((notification) => {
    // Đánh dấu là đã đọc
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Xử lý các loại thông báo khác nhau
    switch(notification.type) {
      case 'garden':
      case 'sensor':
        if (notification.gardenId) {
          navigate(`/gardens/${notification.gardenId}`);
        } else {
          navigate('/gardens');
        }
        break;
      case 'watering':
      case 'schedule':
        navigate('/schedules');
        break;
      case 'weather':
        navigate('/dashboard');
        break;
      case 'system':
      default:
        // Mặc định không điều hướng
        break;
    }
    
    handleCloseNotificationsMenu();
  }, [markAsRead, navigate, handleCloseNotificationsMenu]);

  const handleClearAll = useCallback(() => {
    clearAllNotifications();
    handleCloseNotificationsMenu();
  }, [clearAllNotifications, handleCloseNotificationsMenu]);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleCreateTestNotification = useCallback(() => {
    const types = ['garden', 'sensor', 'watering', 'weather', 'schedule', 'system'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    createTestNotification(randomType);
  }, [createTestNotification]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleToggleMascot = useCallback(() => {
    setShowMascot(prev => !prev);
  }, []);

  return (
    <GlassAppBar position="sticky">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Menu Button for Mobile */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* App Logo & Title for large screens */}
        {!isSmallScreen && <AppLogo />}

        {/* Responsive Search Bar */}
        {isLargeScreen && <SearchBox />}

        {/* Weather Chip - Hide on smallest screens */}
        {!isSmallScreen && <WeatherDisplay isSmallScreen={false} />}

        {/* Actions */}
        <HeaderActions 
          isSmallScreen={isSmallScreen}
          unreadCount={unreadCount}
          hasNewNotification={hasNewNotification}
          handleOpenNotificationsMenu={handleOpenNotificationsMenu}
          colorMode={colorMode}
          toggleColorMode={toggleColorMode}
          handleOpenUserMenu={handleOpenUserMenu}
          user={user}
        />
      </Toolbar>

      {/* Collapsed Search Bar for Mobile - Show when needed */}
      {!isLargeScreen && (
        <Box sx={{ px: 2, pb: 1, display: { xs: 'block', md: 'none' } }}>
          <SearchBox fullWidth={true} />
        </Box>
      )}

      {/* User Menu Dropdown */}
      <UserMenu 
        open={Boolean(anchorElUser)}
        anchorEl={anchorElUser}
        handleClose={handleCloseUserMenu}
        navigate={navigate}
        handleLogout={handleLogout}
      />

      {/* Notifications Menu */}
      <NotificationsMenu 
        open={Boolean(anchorElNotifications)}
        anchorEl={anchorElNotifications}
        handleClose={handleCloseNotificationsMenu}
        notifications={notifications}
        unreadCount={unreadCount}
        handleMarkAllAsRead={handleMarkAllAsRead}
        handleClearAll={handleClearAll}
        handleNotificationClick={handleNotificationClick}
        formatNotificationTime={formatNotificationTime}
        navigate={navigate}
        handleCreateTestNotification={handleCreateTestNotification}
      />

      {/* Mascot helper with mobile optimization */}
      <MascotHelper 
        isVisible={showMascot}
        handleToggle={handleToggleMascot}
        isSmallScreen={isSmallScreen}
        theme={theme}
      />
    </GlassAppBar>
  );
};

// Sử dụng React.memo để tối ưu hóa re-render
export default React.memo(Header); 