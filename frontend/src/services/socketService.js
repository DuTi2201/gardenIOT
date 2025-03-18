import { io } from 'socket.io-client';

// Khởi tạo socket (sẽ được gán giá trị khi khởi tạo)
let socket;

// Tạo kết nối Socket.io
const initializeSocket = () => {
  // Kiểm tra nếu socket đã được khởi tạo và đang kết nối
  if (socket && socket.connected) {
    console.log('Socket.io đã được kết nối từ trước:', socket.id);
    return socket;
  }
  
  console.log('Khởi tạo kết nối Socket.io đến:', process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001');
  
  // Lấy token từ localStorage nếu có
  const token = localStorage.getItem('token');
  console.log('Token từ localStorage:', token ? `${token.substring(0, 20)}...` : 'không có token');
  
  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
    auth: {
      token: token || ''
    }
  });
  
  socket.on('connect', () => {
    console.log('Socket.io đã kết nối với ID:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('Lỗi kết nối Socket.io:', error.message);
    // Thêm xử lý lỗi chi tiết hơn
    if (error.message.includes('token')) {
      console.error('Lỗi xác thực token. Vui lòng đăng nhập lại.');
    }
  });

  socket.on('disconnect', (reason) => {
    console.warn('Socket.io đã ngắt kết nối, lý do:', reason);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket.io đã kết nối lại sau', attemptNumber, 'lần thử');
  });
  
  return socket;
};

// Lấy đối tượng socket
const getSocket = () => {
  return socket;
};

// Phương thức thiếu để đăng ký lắng nghe sự kiện tùy chỉnh
const on = (eventName, callback) => {
  if (!socket) {
    console.warn(`Socket chưa được khởi tạo, không thể lắng nghe sự kiện: ${eventName}`);
    initializeSocket(); // Tự động khởi tạo socket nếu chưa có
  }
  
  if (socket) {
    console.log(`Đăng ký lắng nghe sự kiện: ${eventName}`);
    socket.on(eventName, callback);
  } else {
    console.error(`Không thể đăng ký lắng nghe sự kiện: ${eventName} - Socket không khả dụng`);
  }
};

// Kết nối đến phòng tương ứng với vườn
const joinGardenRoom = (gardenId) => {
  if (!socket) {
    console.warn('Socket chưa được khởi tạo, không thể tham gia phòng');
    socket = initializeSocket(); // Tự động khởi tạo socket nếu chưa có
  }
  
  if (socket) {
    console.log('Tham gia phòng Socket.io cho vườn:', gardenId);
    socket.emit('join_garden', { gardenId });
  }
};

// Lắng nghe cập nhật dữ liệu cảm biến
const onSensorDataUpdate = (callback) => {
  if (!socket) {
    console.warn('Socket chưa được khởi tạo, không thể lắng nghe sự kiện');
    socket = initializeSocket(); // Tự động khởi tạo socket nếu chưa có
  }
  
  if (socket) {
    console.log('Đăng ký lắng nghe cập nhật dữ liệu cảm biến');
    socket.on('sensor_data', (data) => {
      console.log('Nhận được dữ liệu cảm biến qua Socket.io:', data);
      callback(data);
    });
  }
};

// Lắng nghe cập nhật trạng thái thiết bị
const onDeviceStatusUpdate = (callback) => {
  if (!socket) {
    console.warn('Socket chưa được khởi tạo, không thể lắng nghe sự kiện');
    socket = initializeSocket(); // Tự động khởi tạo socket nếu chưa có
  }
  
  if (socket) {
    console.log('Đăng ký lắng nghe cập nhật trạng thái thiết bị');
    socket.on('device_status', (data) => {
      console.log('Nhận được trạng thái thiết bị qua Socket.io:', data);
      callback(data);
    });
  }
};

// Đóng kết nối socket
const disconnectSocket = () => {
  if (socket) {
    console.log('Đóng kết nối Socket.io');
    socket.disconnect();
  }
};

// Rời phòng của vườn
const leaveGardenRoom = (gardenId) => {
  if (socket) {
    console.log('Rời phòng Socket.io của vườn:', gardenId);
    socket.emit('leave_garden', { gardenId });
  }
};

// Lắng nghe sự kiện cập nhật trạng thái kết nối
const onConnectionStatusUpdate = (callback) => {
  if (!socket) {
    console.warn('Socket chưa được khởi tạo, không thể lắng nghe sự kiện');
    socket = initializeSocket(); // Tự động khởi tạo socket nếu chưa có
  }
  
  if (socket) {
    console.log('Đăng ký lắng nghe cập nhật trạng thái kết nối');
    socket.on('connection_status', callback);
  }
};

// Hủy lắng nghe sự kiện
const offEvent = (eventName, callback) => {
  if (socket) {
    console.log('Hủy lắng nghe sự kiện:', eventName);
    socket.off(eventName, callback);
  }
};

// Kiểm tra trạng thái socket
const getSocketStatus = () => {
  return {
    connected: socket?.connected || false,
    id: socket?.id || null
  };
};

// Đăng ký lắng nghe thông báo
const onNotification = (callback) => {
  if (!socket) {
    console.warn('Socket chưa được khởi tạo, không thể lắng nghe thông báo');
    socket = initializeSocket(); // Tự động khởi tạo socket nếu chưa có
  }
  
  if (socket) {
    console.log('Đăng ký lắng nghe thông báo');
    socket.on('new-notification', (data) => {
      console.log('Nhận được thông báo qua Socket.io:', data);
      callback(data);
    });
  }
};

// Gửi sự kiện
const emit = (eventName, data) => {
  if (!socket) {
    console.warn(`Socket chưa được khởi tạo, không thể gửi sự kiện: ${eventName}`);
    socket = initializeSocket(); // Tự động khởi tạo socket nếu chưa có
  }
  
  if (socket) {
    console.log(`Gửi sự kiện ${eventName} qua Socket.io:`, data);
    socket.emit(eventName, data);
  } else {
    console.error(`Không thể gửi sự kiện ${eventName} - Socket không khả dụng`);
  }
};

// Tạo đối tượng dịch vụ socket
const socketService = {
  initializeSocket,
  getSocket,
  on, // Thêm phương thức on() vào API
  emit, // Thêm phương thức emit() vào API
  joinGardenRoom,
  onSensorDataUpdate,
  onDeviceStatusUpdate,
  disconnectSocket,
  leaveGardenRoom,
  onConnectionStatusUpdate,
  offEvent,
  getSocketStatus,
  onNotification
};

export default socketService; 