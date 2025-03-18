const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { createResponse } = require('../utils/helpers');

// Middleware bảo vệ route yêu cầu đăng nhập
exports.protect = async (req, res, next) => {
  let token;

  // Kiểm tra token trong header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Kiểm tra xem token có tồn tại không
  if (!token) {
    logger.warn('Không tìm thấy token xác thực');
    return res.status(401).json(createResponse(false, 'Không được phép truy cập, vui lòng đăng nhập'));
  }

  try {
    // Xác minh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy thông tin người dùng từ token
    const user = await User.findById(decoded.id);

    if (!user) {
      logger.warn(`Không tìm thấy người dùng với ID: ${decoded.id}`);
      return res.status(401).json(createResponse(false, 'Người dùng không tồn tại'));
    }

    // Lưu thông tin người dùng vào request
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    logger.error(`Lỗi xác thực: ${error.message}`);
    return res.status(401).json(createResponse(false, 'Không được phép truy cập, token không hợp lệ'));
  }
};

// Middleware kiểm tra quyền sở hữu vườn
exports.checkGardenOwnership = async (req, res, next) => {
  try {
    const Garden = require('../models/Garden');
    const gardenId = req.params.id;
    const userId = req.user.id;

    console.log(`DEBUG - Kiểm tra quyền sở hữu vườn: gardenId=${gardenId}, userId=${userId}`);
    console.log(`DEBUG - Type: gardenId=${typeof gardenId}, userId=${typeof userId}`);
    
    const garden = await Garden.findById(gardenId);

    if (!garden) {
      console.log(`DEBUG - Không tìm thấy vườn với ID: ${gardenId}`);
      return res.status(404).json(createResponse(false, 'Không tìm thấy vườn'));
    }

    console.log(`DEBUG - Thông tin vườn: ${garden.name}, Chủ sở hữu: ${garden.user_id}`);
    console.log(`DEBUG - Type: user_id trong vườn=${typeof garden.user_id}, userId hiện tại=${typeof userId}`);
    console.log(`DEBUG - String values: user_id trong vườn=${garden.user_id.toString()}, userId hiện tại=${userId}`);
    
    // Kiểm tra xem người dùng có phải là chủ sở hữu của vườn không
    // Chuyển đổi cả hai giá trị sang string để so sánh
    if (garden.user_id.toString() !== userId.toString()) {
      console.log(`DEBUG - Không trùng khớp: user_id trong vườn=${garden.user_id.toString()}, userId hiện tại=${userId.toString()}`);
      logger.warn(`Người dùng ${userId} không có quyền truy cập vườn ${gardenId}`);
      return res.status(403).json(createResponse(false, 'Không có quyền truy cập vườn này'));
    }

    console.log(`DEBUG - Người dùng ${userId} được phép truy cập vườn ${gardenId}`);
    
    // Lưu thông tin vườn vào request
    req.garden = garden;
    next();
  } catch (error) {
    console.error(`Lỗi chi tiết khi kiểm tra quyền sở hữu vườn:`, error);
    logger.error(`Lỗi kiểm tra quyền sở hữu vườn: ${error.message}`);
    return res.status(500).json(createResponse(false, 'Lỗi server'));
  }
}; 