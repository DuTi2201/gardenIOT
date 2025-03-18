/**
 * Các hàm tiện ích cho ứng dụng
 */

// Tạo đối tượng phản hồi chuẩn
const createResponse = (success, message, data = null) => {
  return {
    success,
    message,
    ...(data && { data })
  };
};

// Tạo mã lỗi HTTP tương ứng với lỗi
const getHttpStatusCode = (error) => {
  if (error.name === 'ValidationError') return 400;
  if (error.name === 'CastError') return 400;
  if (error.code === 11000) return 409; // Duplicate key
  if (error.name === 'JsonWebTokenError') return 401;
  if (error.name === 'TokenExpiredError') return 401;
  return 500;
};

// Định dạng thời gian (HH:MM)
const formatTime = (hour, minute) => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Định dạng ngày trong tuần
const formatDays = (days) => {
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days.map(day => dayNames[day]).join(', ');
};

// Tạo mã ngẫu nhiên
const generateRandomCode = (length = 6) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

module.exports = {
  createResponse,
  getHttpStatusCode,
  formatTime,
  formatDays,
  generateRandomCode
}; 