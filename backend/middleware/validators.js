const { body, validationResult } = require('express-validator');
const { createResponse } = require('../utils/helpers');

// Middleware xử lý lỗi validation
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  console.log('Request body:', req.body); // Log request body
  console.log('Validation errors:', errors.array()); // Log validation errors
  if (!errors.isEmpty()) {
    return res.status(400).json(createResponse(
      false, 
      'Dữ liệu không hợp lệ', 
      { errors: errors.array() }
    ));
  }
  next();
};

// Validator đăng ký người dùng
exports.validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Tên đăng nhập phải có từ 3-30 ký tự')
    .isAlphanumeric()
    .withMessage('Tên đăng nhập chỉ được chứa chữ cái và số'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng nhập họ tên'),
  
  exports.handleValidationErrors
];

// Validator đăng nhập
exports.validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng nhập tên đăng nhập'),
  
  body('password')
    .notEmpty()
    .withMessage('Vui lòng nhập mật khẩu'),
  
  exports.handleValidationErrors
];

// Validator tạo vườn mới
exports.validateGarden = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tên vườn phải có từ 1-50 ký tự'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Mô tả không được vượt quá 200 ký tự'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Vị trí không được vượt quá 100 ký tự'),
  
  body('device_serial')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng nhập mã serial thiết bị'),
  
  exports.handleValidationErrors
];

// Validator cài đặt vườn
exports.validateGardenSettings = [
  body('auto_mode')
    .optional()
    .isBoolean()
    .withMessage('Chế độ tự động phải là true hoặc false'),
  
  body('temperature_threshold_high')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Ngưỡng nhiệt độ cao phải từ 0-100'),
  
  body('temperature_threshold_low')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Ngưỡng nhiệt độ thấp phải từ 0-100'),
  
  body('humidity_threshold_high')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Ngưỡng độ ẩm cao phải từ 0-100'),
  
  body('humidity_threshold_low')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Ngưỡng độ ẩm thấp phải từ 0-100'),
  
  body('light_threshold_high')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Ngưỡng ánh sáng cao phải từ 0-100'),
  
  body('light_threshold_low')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Ngưỡng ánh sáng thấp phải từ 0-100'),
  
  body('soil_threshold_high')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Ngưỡng độ ẩm đất cao phải từ 0-100'),
  
  body('soil_threshold_low')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Ngưỡng độ ẩm đất thấp phải từ 0-100'),
  
  exports.handleValidationErrors
];

// Validator lịch trình
exports.validateSchedule = [
  body('device')
    .isIn(['FAN', 'LIGHT', 'PUMP'])
    .withMessage('Thiết bị phải là FAN, LIGHT hoặc PUMP'),
  
  body('action')
    .isBoolean()
    .withMessage('Hành động phải là true (BẬT) hoặc false (TẮT)'),
  
  body('hour')
    .isInt({ min: 0, max: 23 })
    .withMessage('Giờ phải từ 0-23'),
  
  body('minute')
    .isInt({ min: 0, max: 59 })
    .withMessage('Phút phải từ 0-59'),
  
  body('days')
    .isArray()
    .withMessage('Ngày phải là mảng')
    .custom(days => {
      return days.length > 0 && days.every(day => day >= 0 && day <= 6);
    })
    .withMessage('Ngày trong tuần phải từ 0 (Chủ nhật) đến 6 (Thứ bảy)'),
  
  exports.handleValidationErrors
]; 