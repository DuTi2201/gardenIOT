const Garden = require('../models/Garden');
const DeviceHistory = require('../models/DeviceHistory');
const logger = require('../utils/logger');
const { createResponse } = require('../utils/helpers');

// @desc    Lấy trạng thái các thiết bị
// @route   GET /api/gardens/:id/devices/status
// @access  Private
exports.getDevicesStatus = async (req, res) => {
  try {
    const gardenId = req.params.id;
    
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    
    // Lấy dữ liệu cảm biến mới nhất để biết trạng thái thiết bị
    const SensorData = require('../models/SensorData');
    const latestData = await SensorData.findOne({ garden_id: gardenId })
      .sort({ timestamp: -1 });
    
    if (!latestData) {
      return res.json(createResponse(
        true, 
        'Chưa có dữ liệu thiết bị', 
        {
          devices: {
            fan: false,
            light: false,
            pump: false,
            auto: true
          },
          last_updated: null
        }
      ));
    }
    
    res.json(createResponse(
      true, 
      'Lấy trạng thái thiết bị thành công', 
      {
        devices: {
          fan: latestData.fan_status,
          light: latestData.light_status,
          pump: latestData.pump_status,
          auto: latestData.auto_mode
        },
        last_updated: latestData.timestamp
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi lấy trạng thái thiết bị: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Điều khiển thiết bị
// @route   POST /api/gardens/:id/devices/:device/control
// @access  Private
exports.controlDevice = async (req, res) => {
  try {
    const { id: gardenId, device } = req.params;
    const { state } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra thiết bị hợp lệ
    const validDevices = ['FAN', 'LIGHT', 'PUMP', 'AUTO', 'ALL'];
    const deviceUpper = device.toUpperCase();
    
    if (!validDevices.includes(deviceUpper)) {
      return res.status(400).json(createResponse(
        false, 
        'Thiết bị không hợp lệ, phải là một trong: FAN, LIGHT, PUMP, AUTO, ALL'
      ));
    }
    
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    const garden = req.garden;
    
    // Kiểm tra xem vườn có đang kết nối không
    if (!garden.isConnected()) {
      return res.status(400).json(createResponse(
        false, 
        'Vườn không được kết nối, không thể điều khiển thiết bị'
      ));
    }
    
    // Xử lý đặc biệt cho chế độ AUTO: Bật/tắt tất cả lịch trình
    if (deviceUpper === 'AUTO') {
      // Tham chiếu đến mô hình Schedule
      const Schedule = require('../models/Schedule');
      
      // Cập nhật tất cả lịch trình theo trạng thái AUTO
      await Schedule.updateMany(
        { garden_id: gardenId },
        { active: state }
      );
      
      logger.info(`Đã ${state ? 'kích hoạt' : 'vô hiệu hóa'} tất cả lịch trình cho vườn ${gardenId} do chuyển chế độ AUTO -> ${state ? 'BẬT' : 'TẮT'}`);
      
      // Thêm log chi tiết để gỡ lỗi và hiểu rõ hơn
      const updatedSchedules = await Schedule.countDocuments({ garden_id: gardenId, active: state });
      logger.info(`Số lịch trình đã cập nhật: ${updatedSchedules}`);
      
      // Lưu lịch sử với nội dung cụ thể "SCHEDULES_ENABLED" hoặc "SCHEDULES_DISABLED"
      const deviceHistory = new DeviceHistory({
        garden_id: gardenId,
        timestamp: new Date(),
        device: deviceUpper,
        action: state ? 'SCHEDULES_ENABLED' : 'SCHEDULES_DISABLED',
        source: 'USER',
        user_id: userId
      });
      
      await deviceHistory.save();
    }
    
    // Gửi lệnh điều khiển qua MQTT
    const mqttService = require('../services/mqttService');
    await mqttService.sendCommand(gardenId, deviceUpper, state, userId);
    
    // Lưu lịch sử điều khiển
    const deviceHistory = new DeviceHistory({
      garden_id: gardenId,
      timestamp: new Date(),
      device: deviceUpper,
      action: state ? 'ON' : 'OFF',
      source: 'USER',
      user_id: userId
    });
    
    await deviceHistory.save();
    
    logger.info(`Người dùng ${req.user.username} đã điều khiển thiết bị ${deviceUpper} -> ${state ? 'BẬT' : 'TẮT'}`);
    
    res.json(createResponse(
      true, 
      `Đã gửi lệnh ${state ? 'BẬT' : 'TẮT'} ${deviceUpper}`,
      {
        device: deviceUpper,
        state: state
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi điều khiển thiết bị: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Lấy lịch sử điều khiển thiết bị
// @route   GET /api/gardens/:id/devices/history
// @access  Private
exports.getDeviceHistory = async (req, res) => {
  try {
    const gardenId = req.params.id;
    
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    
    // Lấy tham số truy vấn
    const { limit = 20, device } = req.query;
    
    // Xây dựng truy vấn
    const query = { garden_id: gardenId };
    if (device) {
      query.device = device.toUpperCase();
    }
    
    // Lấy lịch sử
    const history = await DeviceHistory.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('user_id', 'username name');
    
    res.json(createResponse(
      true, 
      'Lấy lịch sử điều khiển thiết bị thành công', 
      {
        count: history.length,
        history: history.map(item => ({
          id: item._id,
          device: item.device,
          action: item.action,
          source: item.source,
          timestamp: item.timestamp,
          user: item.user_id ? {
            id: item.user_id._id,
            username: item.user_id.username,
            name: item.user_id.name
          } : null
        }))
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi lấy lịch sử điều khiển thiết bị: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
}; 