const GardenImage = require('../models/GardenImage');
const Garden = require('../models/Garden');
const logger = require('../utils/logger');
const { createResponse } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Đường dẫn lưu trữ hình ảnh
const UPLOAD_DIR = path.join(__dirname, '../uploads/garden_images');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// @desc    Upload hình ảnh từ ESP32-Camera
// @route   POST /api/gardens/:id/images
// @access  ESP32-Camera
exports.uploadImage = async (req, res) => {
  try {
    const gardenId = req.params.id;
    
    // Kiểm tra Garden có tồn tại không
    const garden = await Garden.findById(gardenId);
    if (!garden) {
      return res.status(404).json(createResponse(false, 'Không tìm thấy vườn'));
    }
    
    // Xác thực thiết bị
    const deviceSerial = req.headers['x-device-serial'];
    if (!deviceSerial || deviceSerial !== garden.device_serial) {
      logger.warn(`Thử tải lên hình ảnh với serial không hợp lệ: ${deviceSerial}`);
      return res.status(403).json(createResponse(false, 'Không được phép tải lên'));
    }
    
    // Kiểm tra file ảnh
    if (!req.file) {
      return res.status(400).json(createResponse(false, 'Không tìm thấy hình ảnh'));
    }
    
    // Tạo tên file duy nhất
    const timestamp = Date.now();
    const fileName = `${garden.device_serial}_${timestamp}.jpg`;
    const thumbFileName = `${garden.device_serial}_${timestamp}_thumb.jpg`;
    const webpFileName = `${garden.device_serial}_${timestamp}.webp`;
    
    // Đường dẫn đầy đủ
    const originalPath = path.join(UPLOAD_DIR, fileName);
    const thumbnailPath = path.join(UPLOAD_DIR, thumbFileName);
    const webpPath = path.join(UPLOAD_DIR, webpFileName);
    
    // Lưu file gốc
    fs.writeFileSync(originalPath, req.file.buffer);
    
    // Xử lý ảnh với sharp
    const metadata = await sharp(req.file.buffer).metadata();
    
    // Tạo thumbnail
    await sharp(req.file.buffer)
      .resize(300, 300, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
      
    // Tạo phiên bản WebP
    await sharp(req.file.buffer)
      .webp({ quality: 85 })
      .toFile(webpPath);
    
    // Đường dẫn URL có thể truy cập
    const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
    const imageUrl = `${baseUrl}/uploads/garden_images/${fileName}`;
    const thumbnailUrl = `${baseUrl}/uploads/garden_images/${thumbFileName}`;
    const webpUrl = `${baseUrl}/uploads/garden_images/${webpFileName}`;
    
    // Lấy metadata từ headers
    const lightLevel = req.headers['x-light-level'] ? parseInt(req.headers['x-light-level']) : null;
    const batteryLevel = req.headers['x-battery-level'] ? parseInt(req.headers['x-battery-level']) : null;
    
    // Tạo bản ghi trong database
    const gardenImage = new GardenImage({
      garden_id: gardenId,
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl,
      webp_url: webpUrl,
      capture_date: new Date(),
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        light_level: lightLevel,
        battery_level: batteryLevel
      }
    });
    
    await gardenImage.save();
    
    // Cập nhật thời gian kết nối của vườn
    garden.last_connected = new Date();
    await garden.save();
    
    logger.info(`ESP32-Camera đã tải lên hình ảnh mới cho vườn ${garden.name}`);
    
    return res.status(201).json(createResponse(
      true, 
      'Tải lên hình ảnh thành công', 
      {
        image_id: gardenImage._id,
        image_url: imageUrl
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi tải lên hình ảnh: ${error.message}`);
    return res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Lấy danh sách hình ảnh của vườn
// @route   GET /api/gardens/:id/images
// @access  Private
exports.getGardenImages = async (req, res) => {
  try {
    const gardenId = req.params.id;
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Lấy danh sách hình ảnh
    const images = await GardenImage.find({ garden_id: gardenId })
      .sort({ capture_date: -1 })
      .skip(skip)
      .limit(limit);
    
    // Đếm tổng số hình ảnh
    const total = await GardenImage.countDocuments({ garden_id: gardenId });
    
    return res.json(createResponse(
      true, 
      'Lấy danh sách hình ảnh thành công', 
      {
        images,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi lấy danh sách hình ảnh: ${error.message}`);
    return res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Lấy hình ảnh mới nhất của vườn
// @route   GET /api/gardens/:id/images/latest
// @access  Private
exports.getLatestImage = async (req, res) => {
  try {
    const gardenId = req.params.id;
    
    // Lấy hình ảnh mới nhất
    const latestImage = await GardenImage.findOne({ garden_id: gardenId })
      .sort({ capture_date: -1 });
    
    if (!latestImage) {
      return res.json(createResponse(
        true, 
        'Không có hình ảnh nào cho vườn này', 
        { image: null }
      ));
    }
    
    return res.json(createResponse(
      true, 
      'Lấy hình ảnh mới nhất thành công', 
      { image: latestImage }
    ));
    
  } catch (error) {
    logger.error(`Lỗi lấy hình ảnh mới nhất: ${error.message}`);
    return res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Yêu cầu chụp ảnh từ ESP32-Camera
// @route   POST /api/gardens/:id/images/capture
// @access  Private
exports.requestCaptureImage = async (req, res) => {
  try {
    const gardenId = req.params.id;
    
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    const garden = req.garden;
    
    // TODO: Tích hợp với MQTT để gửi lệnh chụp ảnh đến ESP32-Camera
    // Giả định: Nếu tích hợp MQTT, gửi lệnh capture đến topic garden/{deviceSerial}/command
    
    logger.info(`Người dùng ${req.user.username} yêu cầu chụp ảnh cho vườn ${garden.name}`);
    
    return res.json(createResponse(
      true, 
      'Đã gửi yêu cầu chụp ảnh', 
      { 
        message: 'ESP32-Camera sẽ chụp và tải lên hình ảnh trong ít phút'
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi yêu cầu chụp ảnh: ${error.message}`);
    return res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
}; 