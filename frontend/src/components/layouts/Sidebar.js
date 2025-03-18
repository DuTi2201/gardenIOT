import React, { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
  alpha,
  styled,
  useTheme,
  Tooltip,
  Divider,
  Avatar,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Spa as SpaIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Yard as YardIcon,
  Water as WaterIcon,
  WbSunny as WbSunnyIcon,
  ShowChart as ShowChartIcon,
  ExpandLess,
  ExpandMore,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Devices as DevicesIcon,
  Language as LanguageIcon,
  Help as HelpIcon
} from '@mui/icons-material';

// Định nghĩa các hằng số để tránh tính toán lại
const DRAWER_WIDTHS = {
  expanded: 260,
  collapsed: 72,
  mobile: '85%'
};

// Animated Avatar cho linh vật
const MascotAvatar = styled(Avatar)(({ theme }) => ({
  width: 60,
  height: 60,
  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
  border: '3px solid #81c784',
  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  '&:hover': {
    transform: 'scale(1.05) translateY(-3px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.15)',
  }
}));

// Styled Glassmorphism Drawer
const GlassmorphicDrawer = styled(Drawer)(({ theme, open }) => ({
  width: open ? DRAWER_WIDTHS.expanded : DRAWER_WIDTHS.collapsed,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-paper': {
    width: open ? DRAWER_WIDTHS.expanded : DRAWER_WIDTHS.collapsed,
    boxShadow: open ? '0px 8px 24px rgba(0, 0, 0, 0.07)' : '0px 4px 12px rgba(0, 0, 0, 0.05)',
    background: 'linear-gradient(165deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 250, 0.95) 100%)',
    borderRight: '1px solid rgba(129, 199, 132, 0.2)',
    backdropFilter: 'blur(10px)',
    transition: theme.transitions.create(['width', 'background'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflow: 'hidden',
  },
}));

// Styled List Item Button với animation
const AnimatedListItemButton = styled(ListItemButton)(({ theme, active }) => ({
  margin: '6px 12px',
  borderRadius: '12px',
  overflow: 'hidden',
  padding: '10px 16px',
  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  position: 'relative',
  background: active 
    ? 'linear-gradient(90deg, rgba(129, 199, 132, 0.15) 0%, rgba(129, 199, 132, 0.08) 100%)' 
    : 'transparent',
  
  '&::before': active && {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '4px',
    height: '60%',
    background: 'linear-gradient(180deg, #4CAF50 0%, #81C784 100%)',
    borderRadius: '0px 4px 4px 0px',
  },
  
  '&:hover': {
    background: active 
      ? 'linear-gradient(90deg, rgba(129, 199, 132, 0.2) 0%, rgba(129, 199, 132, 0.12) 100%)' 
      : 'rgba(129, 199, 132, 0.08)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.03)',
  },
}));

// Styled Icon Container với animations tinh tế hơn
const IconContainer = styled(ListItemIcon)(({ theme, open, active }) => ({
  minWidth: open ? 36 : 24,
  color: active 
    ? theme.palette.primary.main 
    : alpha(theme.palette.text.secondary, 0.8),
  display: 'flex',
  justifyContent: open ? 'flex-start' : 'center',
  transition: 'all 0.3s ease',
  '& svg': {
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    fontSize: 22,
    filter: active ? 'drop-shadow(0 2px 3px rgba(76, 175, 80, 0.3))' : 'none',
  },
  '.MuiListItemButton-root:hover &': {
    '& svg': {
      transform: 'scale(1.12) translateY(-1px)',
      color: active 
        ? theme.palette.primary.dark
        : theme.palette.primary.main,
    },
  },
}));

// Styled Text
const StyledListItemText = styled(ListItemText)(({ theme, active }) => ({
  '& .MuiTypography-root': {
    fontWeight: active ? 600 : 500,
    fontSize: '0.9rem',
    color: active ? theme.palette.primary.dark : theme.palette.text.primary,
    letterSpacing: '0.01em',
    transition: 'color 0.3s ease',
  },
}));

// Chiếc nút toggle đáng yêu và tinh tế hơn
const ToggleButton = styled(IconButton)(({ theme, open }) => ({
  position: 'absolute',
  right: open ? 18 : '50%',
  top: open ? 20 : 20,
  transform: open ? 'none' : 'translateX(50%)',
  zIndex: 10,
  background: 'linear-gradient(135deg, #4CAF50, #81C784)',
  color: '#fff',
  borderRadius: '50%',
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  '&:hover': {
    background: 'linear-gradient(135deg, #388E3C, #4CAF50)',
    transform: open ? 'scale(1.1)' : 'translateX(50%) scale(1.1)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
  },
  '&:active': {
    transform: open ? 'scale(0.95)' : 'translateX(50%) scale(0.95)',
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2)',
  },
  '& svg': {
    fontSize: 18,
    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
}));

// Header của Sidebar - tối ưu với memo
const DrawerHeader = memo(({ open, handleDrawerToggle, isMobile }) => {
  const theme = useTheme();
  
  // Memoize styles để tránh tính toán lại
  const headerStyles = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: open ? 'space-between' : 'center',
    padding: open ? theme.spacing(2, 2, 2, 3) : theme.spacing(2, 1),
    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(139, 195, 74, 0.05) 100%)',
    borderBottom: '1px solid rgba(129, 199, 132, 0.1)',
    position: 'relative',
    minHeight: 80,
    transition: theme.transitions.create(['min-height', 'padding'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }), [open, theme]);
  
  return (
    <Box sx={headerStyles}>
      {open ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MascotAvatar src="/linh_vat_2.png" alt="Garden Mascot" />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                fontSize: '1.1rem',
                background: 'linear-gradient(90deg, #388E3C, #4CAF50)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.01em'
              }}
            >
              Garden<span style={{ color: theme.palette.secondary.main }}>IoT</span>
            </Typography>
          </Box>
        </>
      ) : (
        <MascotAvatar src="/linh_vat_2.png" alt="Garden Mascot" />
      )}
      
      {/* Ẩn nút toggle trên mobile vì đã có hamburger menu */}
      {!isMobile && (
        <ToggleButton
          onClick={handleDrawerToggle}
          open={open}
        >
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </ToggleButton>
      )}
    </Box>
  );
});

DrawerHeader.displayName = 'DrawerHeader';

// Footer của Sidebar - tối ưu với memo
const DrawerFooter = memo(({ open }) => {
  const theme = useTheme();
  
  // Memoize styles để tránh tính toán lại
  const footerStyles = useMemo(() => ({
    padding: open ? theme.spacing(2) : theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    justifyContent: open ? 'flex-start' : 'center',
    borderTop: '1px solid rgba(129, 199, 132, 0.1)',
    marginTop: 'auto',
    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(139, 195, 74, 0.03) 100%)',
  }), [open, theme]);
  
  const avatarStyles = useMemo(() => ({ 
    width: 36, 
    height: 36,
    border: '2px solid rgba(129, 199, 132, 0.5)',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'scale(1.1)',
    }
  }), []);
  
  return (
    <Box sx={footerStyles}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          alt="User Avatar"
          sx={avatarStyles}
        />
        {open && (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Người Dùng Garden
            </Typography>
            <Typography variant="caption" color="text.secondary">
              garden@example.com
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
});

DrawerFooter.displayName = 'DrawerFooter';

// Tối ưu hóa các component con
const MenuItem = memo(({ 
  item, 
  isActive, 
  open, 
  hasSubmenu = false, 
  submenuOpen = false, 
  onItemClick 
}) => {
  // Memoize handle click
  const handleClick = useCallback(() => {
    onItemClick(item);
  }, [onItemClick, item]);
  
  // Memoize giá trị active
  const active = useMemo(() => {
    return hasSubmenu ? submenuOpen : isActive(item.path);
  }, [hasSubmenu, submenuOpen, isActive, item.path]);
  
  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <Tooltip 
        title={!open ? item.name : ""} 
        placement="right"
        arrow
      >
        <AnimatedListItemButton
          active={active}
          onClick={handleClick}
        >
          <IconContainer open={open} active={active}>
            {item.icon}
          </IconContainer>
          {open && (
            <>
              <StyledListItemText 
                primary={item.name} 
                active={active}
              />
              {hasSubmenu && (
                submenuOpen ? <ExpandLess /> : <ExpandMore />
              )}
            </>
          )}
        </AnimatedListItemButton>
      </Tooltip>
    </ListItem>
  );
});

MenuItem.displayName = 'MenuItem';

const SubMenuItem = memo(({ 
  item, 
  isActive, 
  open, 
  onItemClick 
}) => {
  // Memoize handle click
  const handleClick = useCallback(() => {
    onItemClick(item);
  }, [onItemClick, item]);
  
  // Memoize giá trị active
  const active = useMemo(() => isActive(item.path), [isActive, item.path]);
  
  // Memoize styles
  const buttonStyles = useMemo(() => ({ 
    pl: open ? 4 : 2, 
    py: 0.8 
  }), [open]);
  
  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <AnimatedListItemButton
        active={active}
        onClick={handleClick}
        sx={buttonStyles}
      >
        <IconContainer open={open} active={active}>
          {item.icon}
        </IconContainer>
        {open && (
          <StyledListItemText 
            primary={item.name} 
            active={active}
          />
        )}
      </AnimatedListItemButton>
    </ListItem>
  );
});

SubMenuItem.displayName = 'SubMenuItem';

// Component con cho submenu
const SubMenu = memo(({ 
  items, 
  isOpen, 
  open, 
  isActive, 
  handleNavigate 
}) => {
  if (!isOpen || !items || items.length === 0) return null;
  
  return (
    <Collapse in={open && isOpen} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        {items.map((subItem) => (
          <SubMenuItem
            key={subItem.name}
            item={subItem}
            isActive={isActive}
            open={open}
            onItemClick={() => handleNavigate(subItem.path)}
          />
        ))}
      </List>
    </Collapse>
  );
});

SubMenu.displayName = 'SubMenu';

// Tách phần Menu chính thành component riêng để dễ tối ưu
const MainMenuSection = memo(({ 
  items,
  submenuItems,
  isActive,
  open,
  submenuOpen,
  handleMenuItemClick,
  handleNavigate
}) => {
  return (
    <>
      <List sx={{ py: 1 }}>
        {items.map((item) => (
          <React.Fragment key={item.name}>
            <MenuItem
              item={item}
              isActive={isActive}
              open={open}
              hasSubmenu={item.hasSubmenu}
              submenuOpen={submenuOpen}
              onItemClick={handleMenuItemClick}
            />
            
            {item.hasSubmenu && (
              <SubMenu
                items={submenuItems}
                isOpen={submenuOpen}
                open={open}
                isActive={isActive}
                handleNavigate={handleNavigate}
              />
            )}
          </React.Fragment>
        ))}
      </List>
    </>
  );
});

MainMenuSection.displayName = 'MainMenuSection';

// Component cho phần menu thứ cấp
const SecondaryMenuSection = memo(({ 
  items,
  isActive,
  open,
  submenuOpen,
  handleMenuItemClick,
  handleNavigate
}) => {
  return (
    <>
      <List sx={{ py: 1 }}>
        {items.map((item) => (
          <React.Fragment key={item.name}>
            <MenuItem
              item={item}
              isActive={isActive}
              open={open}
              hasSubmenu={item.hasSubmenu}
              submenuOpen={submenuOpen}
              onItemClick={handleMenuItemClick}
            />
            
            {item.hasSubmenu && item.submenu && (
              <SubMenu
                items={item.submenu}
                isOpen={submenuOpen}
                open={open}
                isActive={isActive}
                handleNavigate={handleNavigate}
              />
            )}
          </React.Fragment>
        ))}
      </List>
    </>
  );
});

SecondaryMenuSection.displayName = 'SecondaryMenuSection';

// Sidebar Component
const Sidebar = ({ open: propOpen, onToggle, onClose, isMobile }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Sử dụng prop open nếu được cung cấp, nếu không sử dụng state nội bộ
  const [internalOpen, setInternalOpen] = useState(true);
  const open = propOpen !== undefined ? propOpen : internalOpen;
  
  const [gardenSubmenuOpen, setGardenSubmenuOpen] = useState(false);
  const [settingsSubmenuOpen, setSettingsSubmenuOpen] = useState(false);
  
  // Memoize các hàm xử lý sự kiện
  const handleDrawerToggle = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen(!open);
    }
    
    // Nếu đóng drawer, đóng cả submenu
    if (open) {
      setGardenSubmenuOpen(false);
      setSettingsSubmenuOpen(false);
    }
  }, [open, onToggle]);

  const isActive = useCallback((path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }, [location.pathname]);
  
  const toggleGardenSubmenu = useCallback(() => {
    setGardenSubmenuOpen(!gardenSubmenuOpen);
    if (!open) {
      if (onToggle) {
        onToggle(true); // Mở sidebar
      } else {
        setInternalOpen(true);
      }
    }
  }, [gardenSubmenuOpen, open, onToggle]);
  
  const toggleSettingsSubmenu = useCallback(() => {
    setSettingsSubmenuOpen(!settingsSubmenuOpen);
    if (!open) {
      if (onToggle) {
        onToggle(true); // Mở sidebar
      } else {
        setInternalOpen(true);
      }
    }
  }, [settingsSubmenuOpen, open, onToggle]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    // Đóng menu nếu đang ở mobile mode và có callback onClose
    if (isMobile && onClose) {
      onClose();
    }
  }, [navigate, isMobile, onClose]);

  const handleMenuItemClick = useCallback((item) => {
    if (item.hasSubmenu) {
      if (item.name === 'Vườn của tôi') {
        toggleGardenSubmenu();
      } else if (item.name === 'Cài đặt') {
        toggleSettingsSubmenu();
      }
    } else {
      handleNavigate(item.path);
    }
  }, [toggleGardenSubmenu, toggleSettingsSubmenu, handleNavigate]);
  
  // Memoize các menu items để tránh tạo lại khi render
  const mainMenuItems = useMemo(() => [
    { name: 'Dashboard', icon: <HomeIcon fontSize="inherit" />, path: '/dashboard' },
    { name: 'Vườn của tôi', icon: <SpaIcon fontSize="inherit" />, path: '/gardens', hasSubmenu: true },
    { name: 'Lịch tưới cây', icon: <ScheduleIcon fontSize="inherit" />, path: '/schedules' },
    { name: 'Phân tích', icon: <AnalyticsIcon fontSize="inherit" />, path: '/analysis' },
  ], []);
  
  const secondaryMenuItems = useMemo(() => [
    { name: 'Hồ sơ', icon: <PersonIcon fontSize="inherit" />, path: '/profile' },
    { 
      name: 'Cài đặt', 
      icon: <SettingsIcon fontSize="inherit" />, 
      path: '/settings',
      hasSubmenu: true,
      submenu: [
        { name: 'Tài khoản', icon: <PersonIcon fontSize="inherit" />, path: '/settings/account' },
        { name: 'Bảo mật', icon: <SecurityIcon fontSize="inherit" />, path: '/settings/security' },
        { name: 'Thông báo', icon: <NotificationsIcon fontSize="inherit" />, path: '/settings/notifications' },
        { name: 'Thiết bị', icon: <DevicesIcon fontSize="inherit" />, path: '/settings/devices' },
        { name: 'Ngôn ngữ', icon: <LanguageIcon fontSize="inherit" />, path: '/settings/language' },
        { name: 'Trợ giúp', icon: <HelpIcon fontSize="inherit" />, path: '/settings/help' },
      ]
    },
  ], []);
  
  const gardenSubmenuItems = useMemo(() => [
    { name: 'Tất cả vườn', icon: <YardIcon fontSize="inherit" />, path: '/gardens' },
    { name: 'Thêm vườn mới', icon: <AddIcon fontSize="inherit" />, path: '/gardens/connect' },
  ], []);

  // Memoize styles
  const drawerStyles = useMemo(() => ({
    width: isMobile ? DRAWER_WIDTHS.mobile : (open ? DRAWER_WIDTHS.expanded : DRAWER_WIDTHS.collapsed),
    '& .MuiDrawer-paper': {
      width: isMobile ? DRAWER_WIDTHS.mobile : (open ? DRAWER_WIDTHS.expanded : DRAWER_WIDTHS.collapsed),
    }
  }), [isMobile, open]);

  const containerStyles = useMemo(() => ({ 
    overflow: 'auto', 
    flex: 1, 
    px: open ? 1 : 0 
  }), [open]);

  return (
    <GlassmorphicDrawer
      variant={isMobile ? "temporary" : "permanent"}
      open={open}
      sx={drawerStyles}
    >
      <DrawerHeader
        open={open}
        handleDrawerToggle={handleDrawerToggle}
        isMobile={isMobile}
      />
      
      <Divider sx={{ opacity: 0.6, my: 1 }} />
      
      <Box sx={containerStyles}>
        <MainMenuSection 
          items={mainMenuItems}
          submenuItems={gardenSubmenuItems}
          isActive={isActive}
          open={open}
          submenuOpen={gardenSubmenuOpen}
          handleMenuItemClick={handleMenuItemClick}
          handleNavigate={handleNavigate}
        />
        
        <Divider sx={{ opacity: 0.6, my: 1 }} />
        
        <SecondaryMenuSection 
          items={secondaryMenuItems}
          isActive={isActive}
          open={open}
          submenuOpen={settingsSubmenuOpen}
          handleMenuItemClick={handleMenuItemClick}
          handleNavigate={handleNavigate}
        />
      </Box>
      
      <DrawerFooter open={open} />
    </GlassmorphicDrawer>
  );
};

export default memo(Sidebar); 