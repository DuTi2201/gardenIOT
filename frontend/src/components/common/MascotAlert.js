import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Collapse, 
  Button,
  Slide, 
  Snackbar, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import { 
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import AnimatedMascot from './AnimatedMascot';

// Component hiển thị thông báo với linh vật
export const MascotAlert = ({ 
  type = 'info', // 'success', 'error', 'warning', 'info'
  title = '',
  message,
  onClose,
  action = null,
  open = true,
  autoHideDuration = 5000,
  variant = 'inline', // 'inline', 'toast', 'dialog'
  useVideo = false,
  size = 'small'
}) => {
  const [isOpen, setIsOpen] = useState(open);
  const theme = useTheme();

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Xác định màu sắc và icon dựa vào loại cảnh báo
  const getAlertColor = () => {
    switch (type) {
      case 'success':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
      default:
        return theme.palette.info.main;
    }
  };

  const getAlertIcon = () => {
    switch (type) {
      case 'success':
        return <SuccessIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />;
      case 'error':
        return <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />;
      case 'warning':
        return <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />;
      case 'info':
      default:
        return <InfoIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />;
    }
  };

  // Nội dung chính của thông báo
  const alertContent = (
    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      <Box 
        sx={{ 
          marginRight: 2,
          display: 'flex',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        <AnimatedMascot 
          size={size} 
          useVideo={useVideo}
          withShadow={false}
        />
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 0, 
            right: 0,
            transform: 'translate(40%, 20%)'
          }}
        >
          {getAlertIcon()}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        {title && (
          <Typography 
            variant="subtitle1" 
            component="div" 
            sx={{ 
              fontWeight: 600,
              color: getAlertColor(),
              mb: 0.5
            }}
          >
            {title}
          </Typography>
        )}
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {message}
        </Typography>
      </Box>
    </Box>
  );

  // Inline alert - hiển thị trong trang
  if (variant === 'inline') {
    return (
      <Collapse in={isOpen}>
        <Paper
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            border: `1px solid ${getAlertColor()}`,
            display: 'flex',
            justifyContent: 'space-between',
            background: `linear-gradient(to right, ${theme.palette.background.paper}, ${theme.palette.background.paper})`,
            boxShadow: `0 4px 15px rgba(0, 0, 0, 0.05)`,
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              backgroundColor: getAlertColor(),
              borderRadius: '4px 0 0 4px',
            }
          }}
        >
          {alertContent}
          <IconButton 
            size="small" 
            onClick={handleClose}
            sx={{ ml: 1 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Collapse>
    );
  }

  // Toast notification - hiển thị popup
  if (variant === 'toast') {
    return (
      <Snackbar
        open={isOpen}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={Slide}
      >
        <Alert
          severity={type}
          variant="filled"
          icon={false}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{ 
            borderRadius: 3,
            minWidth: '300px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            p: 0,
            backgroundColor: theme.palette.background.paper,
            color: 'text.primary',
            border: `1px solid ${getAlertColor()}`
          }}
        >
          <Box sx={{ p: 1.5 }}>
            {alertContent}
          </Box>
        </Alert>
      </Snackbar>
    );
  }

  // Dialog - cửa sổ modal
  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 10px 35px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          pb: 1, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          '& .MuiIconButton-root': {
            marginRight: -1,
            marginTop: -1
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {getAlertIcon()}
          <Typography 
            variant="h6" 
            sx={{ 
              ml: 1.5, 
              fontWeight: 600,
              color: getAlertColor()
            }}
          >
            {title || (
              type === 'success' ? 'Thành công' :
              type === 'error' ? 'Lỗi' :
              type === 'warning' ? 'Cảnh báo' : 'Thông báo'
            )}
          </Typography>
        </Box>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AnimatedMascot 
            size={size === 'small' ? 'medium' : size} 
            useVideo={useVideo}
          />
          <Typography variant="body1" sx={{ ml: 2 }}>
            {message}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {action}
        <Button 
          onClick={handleClose} 
          variant={action ? 'outlined' : 'contained'} 
          color={type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'primary'}
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: action ? 0.5 : 1,
            fontWeight: 600
          }}
        >
          {action ? 'Đóng' : 'OK'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MascotAlert; 