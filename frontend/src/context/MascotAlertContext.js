import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import MascotAlert from '../components/common/MascotAlert';

const MascotAlertContext = createContext();

export const useMascotAlert = () => {
  const context = useContext(MascotAlertContext);
  if (!context) {
    throw new Error('useMascotAlert must be used within a MascotAlertProvider');
  }
  return context;
};

export const MascotAlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const alertIdCounter = React.useRef(0);

  // Tạo thông báo dạng toast
  const showToast = useCallback((props) => {
    const id = ++alertIdCounter.current;
    const alert = { 
      id, 
      variant: 'toast', 
      autoHideDuration: 5000, 
      ...props 
    };
    
    setAlerts(prev => [...prev, alert]);
    
    return id;
  }, []);

  // Tạo thông báo dạng dialog
  const showDialog = useCallback((props) => {
    const id = ++alertIdCounter.current;
    const alert = { 
      id, 
      variant: 'dialog', 
      ...props 
    };
    
    setAlerts(prev => [...prev, alert]);
    
    return id;
  }, []);

  // Tạo thông báo dạng inline
  const showInline = useCallback((props) => {
    const id = ++alertIdCounter.current;
    const alert = { 
      id, 
      variant: 'inline', 
      ...props 
    };
    
    setAlerts(prev => [...prev, alert]);
    
    return id;
  }, []);

  // Đóng thông báo theo id
  const closeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  // Helpers cho các loại thông báo
  const success = useCallback((message, options = {}) => {
    return showToast({ 
      type: 'success', 
      message, 
      title: options.title || 'Thành công', 
      ...options 
    });
  }, [showToast]);

  const error = useCallback((message, options = {}) => {
    return showToast({ 
      type: 'error', 
      message, 
      title: options.title || 'Lỗi', 
      ...options 
    });
  }, [showToast]);

  const warning = useCallback((message, options = {}) => {
    return showToast({ 
      type: 'warning', 
      message, 
      title: options.title || 'Cảnh báo', 
      ...options 
    });
  }, [showToast]);

  const info = useCallback((message, options = {}) => {
    return showToast({ 
      type: 'info', 
      message, 
      title: options.title || 'Thông báo', 
      ...options 
    });
  }, [showToast]);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      const id = showDialog({
        type: 'warning',
        message,
        title: options.title || 'Xác nhận',
        action: (
          <button
            onClick={() => {
              resolve(true);
              closeAlert(id);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              marginRight: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {options.confirmText || 'Xác nhận'}
          </button>
        ),
        onClose: () => {
          resolve(false);
        },
        ...options
      });
    });
  }, [showDialog, closeAlert]);

  // Xóa tất cả thông báo
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Tự động đóng thông báo toast sau thời gian
  useEffect(() => {
    const timers = alerts
      .filter(alert => alert.variant === 'toast' && alert.autoHideDuration)
      .map(alert => {
        return {
          id: alert.id,
          timer: setTimeout(() => {
            closeAlert(alert.id);
          }, alert.autoHideDuration)
        };
      });

    return () => {
      timers.forEach(timer => clearTimeout(timer.timer));
    };
  }, [alerts, closeAlert]);

  // Render tất cả thông báo
  const alertElements = alerts.map(alert => (
    <MascotAlert
      key={alert.id}
      {...alert}
      onClose={() => closeAlert(alert.id)}
    />
  ));

  return (
    <MascotAlertContext.Provider 
      value={{ 
        alerts, 
        showToast, 
        showDialog, 
        showInline,
        closeAlert, 
        clearAlerts,
        success,
        error,
        warning,
        info,
        confirm
      }}
    >
      {children}
      {alertElements}
    </MascotAlertContext.Provider>
  );
};

export default MascotAlertContext; 