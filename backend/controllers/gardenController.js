const Garden = require('../models/Garden');
const SensorData = require('../models/SensorData');
const logger = require('../utils/logger');
const { createResponse } = require('../utils/helpers');

// @desc    Lấy danh sách vườn của người dùng
// @route   GET /api/gardens
// @access  Private
exports.getGardens = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const gardens = await Garden.find({ user_id: userId })
      .select('name description location device_serial created_at last_connected');
    
    // Thêm trạng thái kết nối cho mỗi vườn
    const gardensWithStatus = gardens.map(garden => {
      const isConnected = garden.isConnected();
      return {
        id: garden._id,
        name: garden.name,
        description: garden.description,
        location: garden.location,
        device_serial: garden.device_serial,
        created_at: garden.created_at,
        last_connected: garden.last_connected,
        is_connected: isConnected
      };
    });
    
    res.json(createResponse(
      true, 
      'Lấy danh sách vườn thành công', 
      {
        count: gardens.length,
        gardens: gardensWithStatus
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi lấy danh sách vườn: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Tạo vườn mới
// @route   POST /api/gardens
// @access  Private
exports.createGarden = async (req, res) => {
  try {
    const { name, description, location, device_serial } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra xem vườn với mã serial này đã tồn tại chưa
    const existingGarden = await Garden.findOne({ device_serial });
    if (existingGarden) {
      return res.status(400).json(createResponse(
        false, 
        'Vườn với mã serial này đã tồn tại'
      ));
    }
    
    // Tạo vườn mới
    const garden = new Garden({
      name,
      description,
      location,
      device_serial,
      user_id: userId,
      created_at: new Date(),
      last_connected: null,
      settings: {
        auto_mode: true,
        temperature_threshold_high: 30,
        temperature_threshold_low: 28,
        humidity_threshold_high: 70,
        humidity_threshold_low: 50,
        light_threshold_high: 50,
        light_threshold_low: 30,
        soil_threshold_high: 60,
        soil_threshold_low: 30
      }
    });
    
    await garden.save();
    logger.info(`Người dùng ${req.user.username} đã tạo vườn mới: ${name} (${device_serial})`);
    
    res.status(201).json(createResponse(
      true, 
      'Tạo vườn mới thành công', 
      {
        garden: {
          id: garden._id,
          name: garden.name,
          description: garden.description,
          location: garden.location,
          device_serial: garden.device_serial,
          created_at: garden.created_at
        }
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi tạo vườn mới: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Lấy thông tin chi tiết vườn
// @route   GET /api/gardens/:id
// @access  Private
exports.getGardenById = async (req, res) => {
  try {
    // Thông tin vườn đã được lấy từ middleware checkGardenOwnership
    const garden = req.garden;
    
    // Lấy dữ liệu cảm biến mới nhất
    const latestSensorData = await SensorData.findOne({ garden_id: garden._id })
      .sort({ timestamp: -1 });
    
    res.json(createResponse(
      true, 
      'Lấy thông tin vườn thành công', 
      {
        garden: {
          id: garden._id,
          name: garden.name,
          description: garden.description,
          location: garden.location,
          device_serial: garden.device_serial,
          created_at: garden.created_at,
          last_connected: garden.last_connected,
          is_connected: garden.isConnected(),
          settings: garden.settings
        },
        sensor_data: latestSensorData || null
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi lấy thông tin vườn: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Cập nhật thông tin vườn
// @route   PUT /api/gardens/:id
// @access  Private
exports.updateGarden = async (req, res) => {
  try {
    const { name, description, location } = req.body;
    const gardenId = req.params.id;
    
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    const garden = req.garden;
    
    // Cập nhật thông tin
    garden.name = name || garden.name;
    garden.description = description !== undefined ? description : garden.description;
    garden.location = location !== undefined ? location : garden.location;
    
    await garden.save();
    
    logger.info(`Người dùng ${req.user.username} đã cập nhật thông tin vườn: ${garden.name}`);
    
    res.json(createResponse(
      true, 
      'Cập nhật thông tin vườn thành công', 
      {
        garden: {
          id: garden._id,
          name: garden.name,
          description: garden.description,
          location: garden.location,
          device_serial: garden.device_serial
        }
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi cập nhật thông tin vườn: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Xóa vườn
// @route   DELETE /api/gardens/:id
// @access  Private
exports.deleteGarden = async (req, res) => {
  try {
    const gardenId = req.params.id;
    
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    const garden = req.garden;
    
    // Xóa tất cả dữ liệu liên quan
    await SensorData.deleteMany({ garden_id: gardenId });
    
    // Xóa vườn
    await garden.remove();
    
    logger.info(`Người dùng ${req.user.username} đã xóa vườn: ${garden.name}`);
    
    res.json(createResponse(true, 'Xóa vườn thành công'));
    
  } catch (error) {
    logger.error(`Lỗi xóa vườn: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Cập nhật cài đặt vườn
// @route   PUT /api/gardens/:id/settings
// @access  Private
exports.updateGardenSettings = async (req, res) => {
  try {
    const gardenId = req.params.id;
    
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    const garden = req.garden;
    
    // Cập nhật từng cài đặt nếu được cung cấp
    const {
      auto_mode,
      temperature_threshold_high,
      temperature_threshold_low,
      humidity_threshold_high,
      humidity_threshold_low,
      light_threshold_high,
      light_threshold_low,
      soil_threshold_high,
      soil_threshold_low
    } = req.body;
    
    if (auto_mode !== undefined) garden.settings.auto_mode = auto_mode;
    if (temperature_threshold_high !== undefined) garden.settings.temperature_threshold_high = temperature_threshold_high;
    if (temperature_threshold_low !== undefined) garden.settings.temperature_threshold_low = temperature_threshold_low;
    if (humidity_threshold_high !== undefined) garden.settings.humidity_threshold_high = humidity_threshold_high;
    if (humidity_threshold_low !== undefined) garden.settings.humidity_threshold_low = humidity_threshold_low;
    if (light_threshold_high !== undefined) garden.settings.light_threshold_high = light_threshold_high;
    if (light_threshold_low !== undefined) garden.settings.light_threshold_low = light_threshold_low;
    if (soil_threshold_high !== undefined) garden.settings.soil_threshold_high = soil_threshold_high;
    if (soil_threshold_low !== undefined) garden.settings.soil_threshold_low = soil_threshold_low;
    
    await garden.save();
    
    logger.info(`Người dùng ${req.user.username} đã cập nhật cài đặt vườn: ${garden.name}`);
    
    // Gửi cài đặt mới đến thiết bị qua MQTT nếu đang kết nối
    if (garden.isConnected()) {
      const mqttService = require('../services/mqttService');
      mqttService.sendSettings(garden._id, garden.settings);
    }
    
    res.json(createResponse(
      true, 
      'Cập nhật cài đặt vườn thành công', 
      { settings: garden.settings }
    ));
    
  } catch (error) {
    logger.error(`Lỗi cập nhật cài đặt vườn: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Lấy trạng thái kết nối vườn
// @route   GET /api/gardens/:id/status
// @access  Private
exports.getGardenStatus = async (req, res) => {
  try {
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    const garden = req.garden;
    
    const isConnected = garden.isConnected();
    
    res.json(createResponse(
      true, 
      'Lấy trạng thái kết nối thành công', 
      {
        is_connected: isConnected,
        last_connected: garden.last_connected
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi lấy trạng thái kết nối: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Lấy dữ liệu cảm biến mới nhất
// @route   GET /api/gardens/:id/data
// @access  Private
exports.getLatestSensorData = async (req, res) => {
  try {
    const gardenId = req.params.id;
    
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    
    // Lấy dữ liệu cảm biến mới nhất
    const latestData = await SensorData.findOne({ garden_id: gardenId })
      .sort({ timestamp: -1 });
    
    if (!latestData) {
      return res.json(createResponse(
        true, 
        'Chưa có dữ liệu cảm biến', 
        { data: null }
      ));
    }
    
    res.json(createResponse(
      true, 
      'Lấy dữ liệu cảm biến thành công', 
      { data: latestData }
    ));
    
  } catch (error) {
    logger.error(`Lỗi lấy dữ liệu cảm biến: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Lấy lịch sử dữ liệu cảm biến
// @route   GET /api/gardens/:id/data/history
// @access  Private
exports.getSensorDataHistory = async (req, res) => {
  try {
    const gardenId = req.params.id;
    const { duration = '24h', limit = 100 } = req.query;
    
    const mongoose = require('mongoose');
    const { ObjectId } = mongoose.Types;
    
    // Tạo điều kiện thời gian dựa vào duration
    let timeFilter = new Date();
    if (duration === '24h') {
      timeFilter.setHours(timeFilter.getHours() - 24);
    } else if (duration === '7d') {
      timeFilter.setDate(timeFilter.getDate() - 7);
    } else if (duration === '30d') {
      timeFilter.setDate(timeFilter.getDate() - 30);
    }
    
    // QUAN TRỌNG: Thêm từ khóa 'new' trước ObjectId để tạo instance đúng cách
    const data = await SensorData
      .find({
        garden_id: new ObjectId(gardenId),
        timestamp: { $gte: timeFilter }
      })
      .sort({ timestamp: 1 })
      .limit(parseInt(limit));
    
    res.json(createResponse(true, 'Lấy lịch sử dữ liệu cảm biến thành công', data));
    
  } catch (error) {
    logger.error(`Lỗi lấy lịch sử dữ liệu cảm biến: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Kết nối vườn mới
// @route   POST /api/gardens/connect
// @access  Private
exports.connectGarden = async (req, res) => {
  try {
    const { serial, name, description, location } = req.body;
    const userId = req.user.id;
    
    console.log('Nhận request kết nối vườn mới:', req.body);
    
    // Kiểm tra xem vườn với mã serial này đã tồn tại chưa
    const existingGarden = await Garden.findOne({ device_serial: serial });
    if (existingGarden) {
      return res.status(400).json(createResponse(
        false, 
        'Vườn với mã serial này đã tồn tại'
      ));
    }
    
    // Tạo vườn mới
    const garden = new Garden({
      name,
      description,
      location,
      device_serial: serial,
      user_id: userId,
      created_at: new Date(),
      last_connected: null,
      settings: {
        auto_mode: true,
        temperature_threshold_high: 30,
        temperature_threshold_low: 28,
        humidity_threshold_high: 70,
        humidity_threshold_low: 50,
        light_threshold_high: 50,
        light_threshold_low: 30,
        soil_threshold_high: 60,
        soil_threshold_low: 30
      }
    });
    
    await garden.save();
    logger.info(`Người dùng ${req.user.username} đã kết nối vườn mới: ${name} (${serial})`);
    
    res.status(201).json(createResponse(
      true, 
      'Kết nối vườn mới thành công', 
      {
        garden: {
          id: garden._id,
          name: garden.name,
          description: garden.description,
          location: garden.location,
          device_serial: garden.device_serial,
          created_at: garden.created_at
        }
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi kết nối vườn mới: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
}; 