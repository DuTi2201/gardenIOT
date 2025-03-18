const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const path = require('path');
const logger = require('./utils/logger');
const { createResponse } = require('./utils/helpers');

// Tải biến môi trường
dotenv.config();

// Khởi tạo Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware cho phép tất cả các origin trong môi trường phát triển
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Không dùng middleware cors và helmet để tránh xung đột
// app.use(cors({...}));
// app.use(helmet({...}));

app.use(morgan('combined', { stream: logger.stream }));

// Passport middleware
app.use(passport.initialize());
require('./config/passport')(passport);

// Định nghĩa các route
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/gardens', require('./routes/gardenRoutes'));
app.use('/api/gardens', require('./routes/deviceRoutes'));
app.use('/api/gardens', require('./routes/scheduleRoutes'));

// Thiết lập middleware cho phép truy cập thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route mặc định
app.get('/', (req, res) => {
  res.json(createResponse(true, 'API Hệ thống IoT Smart Garden'));
});

// Phục vụ tài liệu API (nếu có)
if (process.env.NODE_ENV === 'development') {
  app.use('/docs', express.static(path.join(__dirname, 'docs')));
}

// Xử lý lỗi 404
app.use((req, res, next) => {
  res.status(404).json(createResponse(false, 'Không tìm thấy tài nguyên yêu cầu'));
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).json(createResponse(
    false, 
    'Lỗi server', 
    process.env.NODE_ENV === 'development' ? { error: err.message } : null
  ));
});

module.exports = app; 