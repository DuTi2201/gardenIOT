import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';
import axios from 'axios';
import { toast } from 'react-toastify';

// Tạo context
export const NotificationContext = createContext();

// Provider
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState({
    systemNotifications: true,
    gardenAlerts: true,
    scheduledEvents: true,
    wateringReminders: true,
    weatherAlerts: true,
    newsAndUpdates: false,
    pushNotifications: true,
    emailNotifications: false,
    soundEnabled: true,
  });

  // Cập nhật số lượng thông báo chưa đọc
  useEffect(() => {
    const newUnreadCount = notifications.filter(n => !n.read).length;
    setUnreadCount(newUnreadCount);
  }, [notifications]);

  // Memoize các hàm được sử dụng trong các useEffect khác để tránh tạo lại gerênder không cần thiết
  
  // Kiểm tra xem loại thông báo có được bật trong cài đặt không
  const checkNotificationTypeEnabled = useCallback((type) => {
    switch (type) {
      case 'garden':
      case 'sensor':
        return notificationSettings.gardenAlerts;
      case 'schedule':
        return notificationSettings.scheduledEvents;
      case 'watering':
        return notificationSettings.wateringReminders;
      case 'weather':
        return notificationSettings.weatherAlerts;
      case 'news':
      case 'update':
        return notificationSettings.newsAndUpdates;
      case 'system':
      default:
        return notificationSettings.systemNotifications;
    }
  }, [notificationSettings]);

  // Âm thanh thông báo
  const playNotificationSound = useCallback(() => {
    // Sử dụng AudioContext API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(830, audioContext.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Không thể phát âm thanh thông báo:', error);
    }
  }, []);

  // Thêm thông báo mới
  const addNotification = useCallback((notification) => {
    const newNotification = {
      ...notification,
      id: notification.id || Date.now(),
      read: false,
      createdAt: notification.createdAt || new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  // Lấy cài đặt thông báo từ backend
  const fetchNotificationSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications/settings');
      if (response.data && response.data.success) {
        setNotificationSettings(prev => ({
          ...prev,
          ...response.data.settings
        }));
      }
    } catch (error) {
      console.error('Lỗi khi lấy cài đặt thông báo:', error);
      // Sử dụng cài đặt mặc định nếu không lấy được từ server
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy thông báo từ API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications');
      
      if (response.data && response.data.success) {
        setNotifications(response.data.notifications || []);
      } else {
        // Fallback khi API không hoạt động hoặc server chưa hoàn thiện
        console.warn('Sử dụng dữ liệu thông báo mẫu do API chưa hoàn thiện');
        const mockNotifications = [
          {
            id: 1,
            title: 'Cảnh báo nhiệt độ cao',
            message: 'Nhiệt độ vườn Cà chua đang cao bất thường',
            type: 'garden',
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            gardenId: 1
          },
          {
            id: 2,
            title: 'Độ ẩm đất thấp',
            message: 'Độ ẩm đất vườn Rau xanh đang thấp',
            type: 'sensor',
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            gardenId: 2
          },
          {
            id: 3,
            title: 'Tưới tự động kích hoạt',
            message: 'Hệ thống tưới tự động đã được kích hoạt',
            type: 'watering',
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            gardenId: 1
          },
          {
            id: 4,
            title: 'Dự báo thời tiết',
            message: 'Dự báo mưa vào ngày mai, hệ thống sẽ điều chỉnh lịch tưới',
            type: 'weather',
            read: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          },
          {
            id: 5,
            title: 'Cập nhật ứng dụng',
            message: 'Đã có bản cập nhật mới với nhiều tính năng mới',
            type: 'system',
            read: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          }
        ];
        
        setNotifications(mockNotifications);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error);
      setError('Không thể lấy thông báo. Vui lòng thử lại sau.');
      
      // Sử dụng dữ liệu mẫu khi có lỗi
      const mockNotifications = [
        {
          id: 1,
          title: 'Cảnh báo nhiệt độ cao',
          message: 'Nhiệt độ vườn Cà chua đang cao bất thường',
          type: 'garden',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          gardenId: 1
        },
        // Thêm thông báo mẫu khác nếu cần
      ];
      
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  }, []);

  // Đánh dấu thông báo đã đọc
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Cập nhật UI trước để người dùng thấy phản hồi ngay lập tức
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ));
      
      // Cập nhật lên server
      await axios.post(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
      // Không hoàn tác UI để tránh trải nghiệm không tốt cho người dùng
    }
  }, []);

  // Đánh dấu tất cả là đã đọc
  const markAllAsRead = useCallback(async () => {
    try {
      // Cập nhật UI trước
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      
      // Cập nhật lên server
      await axios.post('/api/notifications/mark-all-read');
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả đã đọc:', error);
    }
  }, []);

  // Xóa thông báo
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      // Cập nhật UI trước
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      // Cập nhật lên server
      await axios.delete(`/api/notifications/${notificationId}`);
    } catch (error) {
      console.error('Lỗi khi xóa thông báo:', error);
      // Khôi phục thông báo nếu có lỗi (cần lưu trữ state trước khi xóa)
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Xóa tất cả thông báo
  const clearAllNotifications = useCallback(async () => {
    try {
      // Cập nhật UI trước
      setNotifications([]);
      
      // Cập nhật lên server
      await axios.delete('/api/notifications');
    } catch (error) {
      console.error('Lỗi khi xóa tất cả thông báo:', error);
      // Khôi phục thông báo nếu có lỗi
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Cập nhật cài đặt thông báo
  const updateNotificationSettings = useCallback(async (settings) => {
    try {
      // Cập nhật UI trước
      setNotificationSettings(settings);
      
      // Cập nhật lên server
      await axios.post('/api/notifications/settings', { settings });
      
      // Thông báo thành công
      toast.success('Cài đặt thông báo đã được cập nhật', {
        position: "top-right",
        autoClose: 3000
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật cài đặt thông báo:', error);
      // Thông báo lỗi
      toast.error('Không thể cập nhật cài đặt thông báo', {
        position: "top-right",
        autoClose: 5000
      });
    }
  }, []);

  // Format thời gian thông báo
  const formatNotificationTime = useCallback((createdAt) => {
    if (!createdAt) return '';

    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Vừa xong';
    }
    
    if (diffMins < 60) {
      return `${diffMins} phút trước`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return `${diffDays} ngày trước`;
    }
    
    // Format theo định dạng ngày/tháng/năm nếu quá lâu
    return `${notificationTime.getDate()}/${notificationTime.getMonth() + 1}/${notificationTime.getFullYear()}`;
  }, []);

  // Lấy biểu tượng cho loại thông báo
  const getNotificationIcon = useCallback((type) => {
    return type; // Giả sử component Notification sẽ lấy đúng biểu tượng dựa vào loại
  }, []);

  // Tạo thông báo test (chỉ dùng trong môi trường dev)
  const createTestNotification = useCallback(async (type = 'system') => {
    try {
      // Tạo dữ liệu thông báo mẫu
      const testNotification = {
        title: `Thông báo thử nghiệm (${type})`,
        message: `Đây là thông báo thử nghiệm loại ${type}, tạo lúc ${new Date().toLocaleTimeString()}`,
        type: type,
        createdAt: new Date().toISOString()
      };
      
      // Thử gọi API tạo thông báo
      const response = await axios.post('/api/notifications/test', testNotification);
      
      if (response.data && response.data.success) {
        // Nếu API thành công, dùng thông báo từ server
        addNotification(response.data.notification);
      } else {
        // Nếu API không thành công, thêm thông báo test vào local state
        addNotification(testNotification);
      }
      
      // Phát âm thanh nếu được bật
      if (notificationSettings.soundEnabled) {
        playNotificationSound();
      }
      
      return true;
    } catch (error) {
      console.error('Lỗi khi tạo thông báo test:', error);
      
      // Thêm thông báo test vào local state
      const testNotification = {
        id: Date.now(),
        title: `Thông báo thử nghiệm (${type})`,
        message: `Đây là thông báo thử nghiệm loại ${type}, tạo lúc ${new Date().toLocaleTimeString()}`,
        type: type,
        createdAt: new Date().toISOString()
      };
      
      addNotification(testNotification);
      
      // Phát âm thanh nếu được bật
      if (notificationSettings.soundEnabled) {
        playNotificationSound();
      }
      
      return true;
    }
  }, [notificationSettings.soundEnabled, addNotification, playNotificationSound]);

  // Lấy cài đặt thông báo từ backend
  useEffect(() => {
    if (user) {
      fetchNotificationSettings();
    }
  }, [user, fetchNotificationSettings]);

  // Lắng nghe thông báo mới qua socket
  useEffect(() => {
    if (user) {
      // Khởi tạo Socket.io nếu chưa được khởi tạo
      socketService.initializeSocket();
      
      // Kết nối socket và lắng nghe sự kiện thông báo mới
      const handleNewNotification = (notification) => {
        // Kiểm tra cài đặt thông báo
        const notificationType = notification.type || 'system';
        
        // Kiểm tra xem loại thông báo có được cho phép không
        const isEnabled = checkNotificationTypeEnabled(notificationType);
        
        if (isEnabled) {
          addNotification(notification);
          
          // Phát âm thanh nếu được bật
          if (notificationSettings.soundEnabled) {
            playNotificationSound();
          }

          // Hiển thị toast nếu đó là thông báo mới
          toast.info(`${notification.title}: ${notification.message}`, {
            position: "top-right",
            autoClose: 5000
          });
        }
      };

      // Đăng ký lắng nghe sự kiện new-notification
      socketService.onNotification(handleNewNotification);
      
      // Lấy dữ liệu thông báo ban đầu
      fetchNotifications();

      return () => {
        // Cleanup - hủy đăng ký lắng nghe sự kiện
        const socket = socketService.getSocket();
        if (socket) {
          socket.off('new-notification', handleNewNotification);
        }
      };
    }
  }, [user, notificationSettings, checkNotificationTypeEnabled, addNotification, playNotificationSound, fetchNotifications]);

  // Tối ưu hóa giá trị context bằng useMemo
  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    notificationSettings,
    loading,
    error,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateNotificationSettings,
    formatNotificationTime,
    getNotificationIcon,
    createTestNotification,
    fetchNotifications
  }), [
    notifications,
    unreadCount,
    notificationSettings,
    loading,
    error,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateNotificationSettings,
    formatNotificationTime,
    getNotificationIcon,
    createTestNotification,
    fetchNotifications
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook để sử dụng context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications phải được sử dụng trong NotificationProvider');
  }
  
  return context;
}; 