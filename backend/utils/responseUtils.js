/**
 * Tạo cấu trúc phản hồi chuẩn cho API
 * @param {Boolean} success - Trạng thái thành công của yêu cầu
 * @param {String} message - Thông báo mô tả kết quả
 * @param {Object} data - Dữ liệu trả về (nếu có)
 * @returns {Object} - Đối tượng phản hồi chuẩn
 */
const createResponse = (success, message, data = null) => {
  return {
    success,
    message,
    data
  };
};

module.exports = createResponse; 