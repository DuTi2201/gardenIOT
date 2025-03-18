/**
 * Định dạng ngày giờ thành chuỗi ngày tháng năm
 * @param {String|Date} dateStr - Chuỗi ngày giờ hoặc đối tượng Date
 * @returns {String} - Chuỗi ngày tháng năm đã định dạng
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  
  // Kiểm tra nếu date không hợp lệ
  if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
  
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Định dạng ngày giờ thành chuỗi giờ phút
 * @param {String|Date} dateStr - Chuỗi ngày giờ hoặc đối tượng Date
 * @returns {String} - Chuỗi giờ phút đã định dạng
 */
export const formatTime = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  
  // Kiểm tra nếu date không hợp lệ
  if (isNaN(date.getTime())) return 'Thời gian không hợp lệ';
  
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Định dạng ngày giờ đầy đủ
 * @param {String|Date} dateStr - Chuỗi ngày giờ hoặc đối tượng Date
 * @returns {String} - Chuỗi ngày tháng năm giờ phút đã định dạng
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  
  // Kiểm tra nếu date không hợp lệ
  if (isNaN(date.getTime())) return 'Thời gian không hợp lệ';
  
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Định dạng số thành chuỗi có phần thập phân
 * @param {Number} value - Giá trị số cần định dạng
 * @param {Number} decimals - Số chữ số thập phân (mặc định: 1)
 * @returns {String} - Chuỗi số đã định dạng
 */
export const formatNumber = (value, decimals = 1) => {
  if (value === null || value === undefined) return '';
  
  return Number(value).toFixed(decimals);
};

/**
 * Chuyển đổi số phút thành chuỗi giờ:phút
 * @param {Number} minutes - Số phút
 * @returns {String} - Chuỗi giờ:phút
 */
export const formatMinutesToTime = (minutes) => {
  if (minutes === null || minutes === undefined) return '';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Chuyển đổi từ mảng các ngày trong tuần (0-6) thành chuỗi mô tả
 * @param {Array} days - Mảng các ngày trong tuần (0: CN, 1-6: T2-T7)
 * @returns {String} - Chuỗi mô tả các ngày
 */
export const formatWeekdays = (days) => {
  if (!Array.isArray(days) || days.length === 0) return 'Không có';
  
  // Nếu có đủ 7 ngày
  if (days.length === 7) return 'Hàng ngày';
  
  // Danh sách tên các ngày
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  // Chuyển đổi số ngày thành tên
  return days.map(day => dayNames[day]).join(', ');
}; 