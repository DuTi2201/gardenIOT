const http = require('http');
const socketIO = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const mqttService = require('./services/mqttService');
const scheduleService = require('./services/scheduleService');
const os = require('os');

// Hàm lấy địa chỉ IP của máy chủ
function getServerIPs() {
  const networkInterfaces = os.networkInterfaces();
  const result = [];
  
  // Lặp qua tất cả các interface mạng
  Object.keys(networkInterfaces).forEach((ifaceName) => {
    // Lọc các địa chỉ IPv4, không phải loopback và không phải internal
    const addresses = networkInterfaces[ifaceName].filter(iface => 
      iface.family === 'IPv4' && !iface.internal);
    
    // Thêm vào danh sách kết quả
    addresses.forEach(iface => {
      result.push({
        name: ifaceName,
        address: iface.address
      });
    });
  });
  
  return result;
}

// Kết nối đến cơ sở dữ liệu
connectDB();

// Tạo HTTP server
const server = http.createServer(app);

// Khởi tạo Socket.io
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io handlers
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  // Xác thực người dùng
  const token = socket.handshake.auth.token;
  if (!token) {
    logger.warn(`Socket ${socket.id} không có token xác thực`);
    socket.disconnect();
    return;
  }
  
  // Log thông tin token để debug
  logger.info(`Socket ${socket.id} có token: ${token.substring(0, 20)}...`);
  
  // Tham gia phòng cho vườn cụ thể
  socket.on('join_garden', (gardenId) => {
    // Kiểm tra nếu gardenId là object
    const garden = typeof gardenId === 'object' ? gardenId.gardenId : gardenId;
    if (!garden) {
      logger.warn(`Socket ${socket.id} gửi gardenId không hợp lệ:`, gardenId);
      return;
    }
    socket.join(`garden_${garden}`);
    logger.info(`Socket ${socket.id} đã tham gia phòng garden_${garden}`);
  });
  
  // Rời phòng của vườn
  socket.on('leave_garden', (gardenId) => {
    socket.leave(`garden_${gardenId}`);
    logger.info(`Socket ${socket.id} đã rời phòng garden_${gardenId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Khởi động MQTT service
const mqttClient = mqttService.startMqttService(io);

// Khởi động Schedule service
scheduleService.startScheduleService(mqttService);

// Khởi động server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  // Log thông tin server và IP
  logger.info(`Server đang chạy trên cổng ${PORT}`);
  logger.info(`Môi trường: ${process.env.NODE_ENV}`);
  
  // Lấy và log tất cả địa chỉ IP của server
  const serverIPs = getServerIPs();
  if (serverIPs.length > 0) {
    logger.info('Địa chỉ IP của server:');
    serverIPs.forEach(ip => {
      logger.info(`- Interface ${ip.name}: ${ip.address}`);
    });
    
    // Gợi ý kết nối MQTT
    logger.info('Để kết nối MQTT từ Wemos, hãy sử dụng một trong các địa chỉ IP trên');
    logger.info('Ví dụ: const char* mqtt_server = "' + serverIPs[0].address + '";');
  } else {
    logger.warn('Không tìm thấy địa chỉ IP nào cho server');
  }
});

// Xử lý lỗi không bắt được
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  logger.error(err.stack);
});

// Xử lý tắt server
process.on('SIGTERM', () => {
  logger.info('SIGTERM nhận được. Đang tắt server...');
  server.close(() => {
    logger.info('Server đã đóng.');
    process.exit(0);
  });
}); 