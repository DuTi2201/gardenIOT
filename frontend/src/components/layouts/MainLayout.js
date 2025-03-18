import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Avatar, 
  Menu, 
  MenuItem, 
  Tooltip,
  useTheme,
  useMediaQuery,
  Container,
  Badge,
  Button,
  InputBase,
  alpha,
  ThemeProvider,
  createTheme,
  styled
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Yard as YardIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Analytics as AnalyticsIcon,
  WaterDrop as WaterDropIcon,
  Search as SearchIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  MoreVert as MoreVertIcon,
  DoneAll as DoneAllIcon,
  DeleteSweep as DeleteSweepIcon,
  Done as DoneIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import AnimatedMascot from '../common/AnimatedMascot';
import Header from './Header';
import Sidebar from './Sidebar';

const drawerWidth = 280;

// Main container
const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, rgba(250, 250, 250, 0.9) 0%, rgba(245, 245, 245, 0.95) 100%)',
  backgroundSize: 'cover',
  backgroundAttachment: 'fixed',
  position: 'relative',
  overflow: 'hidden',
  
  // Decorative elements
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '5%',
    right: '5%',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.02) 70%, transparent 100%)',
    zIndex: 0,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '5%',
    left: '5%',
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255, 193, 7, 0.05) 0%, rgba(255, 193, 7, 0.02) 70%, transparent 100%)',
    zIndex: 0,
  }
}));

// Content container with subtle backdrop filter effect
const ContentContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  position: 'relative',
  zIndex: 1,
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(5px)',
}));

// Page content with glass morphism
const PageContent = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  position: 'relative',
  zIndex: 1,
  overflow: 'auto',
  
  // For Firefox which doesn't support backdropFilter
  '@supports not (backdrop-filter: blur(10px))': {
    background: 'rgba(255, 255, 255, 0.9)',
  },
}));

const MainLayout = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
  const [notificationsCount, setNotificationsCount] = useState(3);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: 'Nhiệt độ vườn Cà chua đang cao bất thường',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
      type: 'warning'
    },
    {
      id: 2,
      message: 'Độ ẩm đất vườn Rau xanh đang thấp',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
      type: 'info'
    },
    {
      id: 3,
      message: 'Hệ thống tưới tự động đã được kích hoạt',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      read: true,
      type: 'success'
    }
  ]);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
  const isNotificationsOpen = Boolean(notificationAnchorEl);
  const [colorMode, setColorMode] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Tự động điều chỉnh sidebar dựa trên kích thước màn hình
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Đóng sidebar khi chuyển trang trên thiết bị di động
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location, isMobile]);

  // Hàm chuyển đổi chế độ tối
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Lưu trạng thái vào localStorage để giữ nguyên khi refresh
    localStorage.setItem('darkMode', !darkMode);
  };

  // Khôi phục trạng thái chế độ tối từ localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  // Kết nối Socket.IO khi có token
  useEffect(() => {
    if (token) {
      socketService.initializeSocket();
    }

    return () => {
      socketService.disconnectSocket();
    };
  }, [token]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
    setSidebarOpen(!sidebarOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleNotificationsOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
    setNotificationsCount(0);
  };

  const handleMarkAsRead = (id) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
    setNotificationsCount(prev => Math.max(0, prev - 1));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setNotificationsCount(0);
    handleNotificationsClose();
  };

  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    
    // Dưới 1 phút
    if (diff < 60 * 1000) {
      return 'Vừa xong';
    }
    
    // Dưới 1 giờ
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} phút trước`;
    }
    
    // Dưới 1 ngày
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} giờ trước`;
    }
    
    // Trên 1 ngày
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days} ngày trước`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
      case 'error':
        return <ErrorIcon sx={{ color: theme.palette.error.main }} />;
      case 'success':
        return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
      case 'info':
      default:
        return <InfoIcon sx={{ color: theme.palette.info.main }} />;
    }
  };

  // Hàm render menu item
  const renderMenuItem = (item) => {
    // Kiểm tra nếu đường dẫn chứa tham số động
    const isActive = item.path.includes(':id')
      ? location.pathname.includes(item.path.split('/:id')[0])
      : location.pathname === item.path;
      
    return (
      <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton 
          selected={isActive}
          onClick={() => {
            // Xử lý đường dẫn có tham số động
            if (item.path.includes(':id')) {
              // Nếu đang ở trong một vườn cụ thể, sử dụng ID đó
              const currentGardenId = location.pathname.split('/gardens/')[1]?.split('/')[0];
              if (currentGardenId) {
                navigate(item.path.replace(':id', currentGardenId));
              } else {
                // Nếu không có ID vườn hiện tại, chuyển hướng đến danh sách vườn
                navigate('/gardens');
              }
            } else {
              navigate(item.path);
            }
            setMobileOpen(false);
          }}
          sx={{
            borderRadius: '10px',
            py: 1.2,
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
              },
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        >
          <ListItemIcon 
            sx={{ 
              color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
              minWidth: 40
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.text} 
            primaryTypographyProps={{
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.95rem',
              color: isActive ? theme.palette.primary.main : theme.palette.text.primary
            }}
          />
          {isActive && (
            <Box 
              sx={{ 
                width: 4, 
                height: 32, 
                bgcolor: theme.palette.primary.main,
                borderRadius: '0 4px 4px 0',
                position: 'absolute',
                left: 0
              }} 
            />
          )}
        </ListItemButton>
      </ListItem>
    );
  };

  const menuItems = [
    { 
      text: 'Bảng điều khiển', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      category: 'main'
    },
    { 
      text: 'Danh sách vườn', 
      icon: <YardIcon />, 
      path: '/gardens',
      category: 'main'
    },
    { 
      text: 'Cài đặt', 
      icon: <SettingsIcon />, 
      path: '/settings',
      category: 'main'
    },
  ];

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      id="user-menu"
      keepMounted
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      open={isMenuOpen}
      onClose={handleMenuClose}
      PaperProps={{
        elevation: 3,
        sx: {
          borderRadius: 2,
          minWidth: 220,
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
          mt: 1.5,
          bgcolor: darkMode ? '#1E1E1E' : 'white',
          color: darkMode ? 'white' : 'inherit',
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: darkMode ? '#1E1E1E' : 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {user?.name || user?.username}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {user?.email}
        </Typography>
      </Box>
      <Divider />
      <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }} sx={{ py: 1.5 }}>
        <ListItemIcon>
          <PersonIcon fontSize="small" color="primary" />
        </ListItemIcon>
        <ListItemText primary="Hồ sơ cá nhân" />
      </MenuItem>
      <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }} sx={{ py: 1.5 }}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" color="primary" />
        </ListItemIcon>
        <ListItemText primary="Cài đặt" />
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" color="error" />
        </ListItemIcon>
        <ListItemText primary="Đăng xuất" primaryTypographyProps={{ color: 'error' }} />
      </MenuItem>
    </Menu>
  );

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      id="mobile-menu"
      keepMounted
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
      PaperProps={{
        elevation: 3,
        sx: {
          borderRadius: 2,
          minWidth: 200,
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
          mt: 1.5,
          bgcolor: darkMode ? '#1E1E1E' : 'white',
          color: darkMode ? 'white' : 'inherit',
        },
      }}
    >
      <MenuItem onClick={() => { handleMobileMenuClose(); }}>
        <IconButton color="inherit" size="small">
          <Badge badgeContent={notificationsCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <Typography variant="subtitle2" sx={{ ml: 1 }}>Thông báo</Typography>
      </MenuItem>
      <MenuItem onClick={() => { handleMobileMenuClose(); toggleDarkMode(); }}>
        <IconButton color="inherit" size="small">
          {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
        <Typography variant="subtitle2" sx={{ ml: 1 }}>{darkMode ? "Chế độ sáng" : "Chế độ tối"}</Typography>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton size="small">
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32,
              bgcolor: theme.palette.primary.main
            }}
          >
            {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </Avatar>
        </IconButton>
        <Typography variant="subtitle2" sx={{ ml: 1 }}>Tài khoản</Typography>
      </MenuItem>
    </Menu>
  );

  const renderNotifications = (
    <Menu
      anchorEl={notificationAnchorEl}
      id="notifications-menu"
      keepMounted
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      open={isNotificationsOpen}
      onClose={handleNotificationsClose}
      PaperProps={{
        elevation: 3,
        sx: {
          borderRadius: 2,
          minWidth: 320,
          maxWidth: 360,
          maxHeight: 480,
          overflow: 'hidden',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
          mt: 1.5,
          bgcolor: darkMode ? '#1E1E1E' : 'white',
          color: darkMode ? 'white' : 'inherit',
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: darkMode ? '#1E1E1E' : 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Thông báo
          </Typography>
          <Box>
            <Tooltip title="Đánh dấu tất cả là đã đọc">
              <IconButton size="small" onClick={handleMarkAllAsRead}>
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa tất cả thông báo">
              <IconButton size="small" onClick={handleClearNotifications}>
                <DeleteSweepIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ overflowY: 'auto', maxHeight: 320 }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsOffIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Không có thông báo nào
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <ListItem 
                key={notification.id}
                sx={{ 
                  px: 2, 
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  }
                }}
                secondaryAction={
                  !notification.read && (
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <DoneIcon fontSize="small" />
                    </IconButton>
                  )
                }
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.message}
                  secondary={formatNotificationTime(notification.timestamp)}
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    fontWeight: notification.read ? 400 : 600,
                    sx: { 
                      mb: 0.5,
                      pr: notification.read ? 0 : 4
                    }
                  }}
                  secondaryTypographyProps={{ 
                    variant: 'caption',
                    sx: { 
                      color: 'text.secondary',
                      fontStyle: 'italic'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
        <Button 
          size="small" 
          color="primary"
          onClick={handleNotificationsClose}
          sx={{ 
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          Xem tất cả
        </Button>
      </Box>
    </Menu>
  );

  // Tạo theme tối dựa trên theme hiện tại
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#2E7D32', // Giữ nguyên màu primary
        light: '#4CAF50',
        dark: '#1B5E20',
      },
      secondary: {
        main: '#FFC107', // Cập nhật màu secondary để phù hợp với linh vật
        light: '#FFD54F',
        dark: '#FFA000',
      },
      background: {
        default: '#121212',
        paper: '#1E1E1E',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: '#2E7D32',
          },
        },
      },
    },
  });

  // Chọn theme dựa vào chế độ tối/sáng
  const currentTheme = darkMode ? darkTheme : theme;

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          padding: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
          borderRadius: '0 0 20px 20px',
          marginBottom: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          mb: 2,
          width: '100%'
        }}>
          <AnimatedMascot
            size="small"
            useVideo={true}
            style={{
              position: 'absolute',
              top: -5,
              left: -15,
            }}
          />
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            sx={{ 
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              ml: 8
            }}
          >
            Garden IoT
          </Typography>
        </Box>
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Avatar
              alt={user.name || 'User'}
              src={user.avatar || ''}
              sx={{ 
                width: 48, 
                height: 48, 
                border: '3px solid white',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
              }}
            />
            <Box sx={{ ml: 1.5, color: 'white' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {user.name || 'Người dùng'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {user.email}
              </Typography>
            </Box>
          </Box>
        )}
      </Toolbar>

      <Divider sx={{ mb: 2, borderColor: 'rgba(0, 0, 0, 0.06)' }} />

      <List sx={{ px: 1, flexGrow: 1 }}>
        {renderMenuItem({
          text: 'Tổng quan',
          icon: <DashboardIcon />,
          path: '/',
          exact: true,
        })}
        {renderMenuItem({
          text: 'Danh sách vườn',
          icon: <YardIcon />,
          path: '/gardens',
        })}
        {renderMenuItem({
          text: 'Thêm vườn mới',
          icon: <AddIcon />,
          path: '/gardens/connect',
        })}
        {renderMenuItem({
          text: 'Lịch tưới nước',
          icon: <ScheduleIcon />,
          path: '/schedules',
        })}
        {renderMenuItem({
          text: 'Phân tích dữ liệu',
          icon: <AnalyticsIcon />,
          path: '/analysis',
        })}
        <Divider sx={{ my: 2, borderColor: 'rgba(0, 0, 0, 0.06)' }} />
        {renderMenuItem({
          text: 'Cài đặt',
          icon: <SettingsIcon />,
          path: '/settings',
        })}
        {renderMenuItem({
          text: 'Thông tin cá nhân',
          icon: <PersonIcon />,
          path: '/profile',
        })}
      </List>

      <Box sx={{ p: 2, mt: 'auto' }}>
        <Button
          variant="outlined"
          color="error"
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ 
            borderRadius: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Đăng xuất
        </Button>
        <Typography variant="caption" display="block" textAlign="center" mt={1.5} color="text.secondary">
          © 2024 GardenIOT
        </Typography>
      </Box>
    </Box>
  );

  const toggleColorMode = () => {
    setColorMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <MainContainer>
        {/* Sidebar cho màn hình lớn */}
        {!isMobile && <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
        
        {/* Sidebar cho thiết bị di động */}
        {isMobile && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Tốt hơn cho SEO và hiệu suất mobile
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { width: '85%', maxWidth: '280px' },
            }}
          >
            <Sidebar 
              open={true} 
              onToggle={handleDrawerToggle} 
              onClose={handleDrawerToggle}
              isMobile={true}
            />
          </Drawer>
        )}
        
        <ContentContainer>
          <Header 
            toggleColorMode={toggleColorMode} 
            colorMode={colorMode}
            handleDrawerToggle={handleDrawerToggle}
            isMobile={isMobile}
          />
          <PageContent 
            sx={{ 
              p: isSmallScreen ? 1.5 : 3,
              pt: isSmallScreen ? 2 : 3
            }}
          >
            <Outlet />
          </PageContent>
        </ContentContainer>
      </MainContainer>
    </ThemeProvider>
  );
};

export default MainLayout; 