const mongoose = require('mongoose');
const Garden = require('./models/Garden');
const SensorData = require('./models/SensorData');

// ID của vườn cần xóa (lấy từ list-gardens.js)
const gardenId = '67cc89d4d63361c4244aff5a';

async function deleteGarden() {
  try {
    // Kết nối đến MongoDB
    await mongoose.connect('mongodb://localhost:27017/iot_garden');
    console.log('Đã kết nối đến MongoDB');
    
    // Kiểm tra xem vườn có tồn tại không
    const garden = await Garden.findById(gardenId);
    if (!garden) {
      console.log('Không tìm thấy vườn với ID:', gardenId);
      await mongoose.disconnect();
      process.exit(0);
    }
    
    console.log('Đã tìm thấy vườn:', garden.name);
    console.log('Mã serial thiết bị:', garden.device_serial);
    
    // Xóa tất cả dữ liệu cảm biến liên quan
    const sensorDataResult = await SensorData.deleteMany({ garden_id: gardenId });
    console.log('Đã xóa dữ liệu cảm biến:', sensorDataResult.deletedCount, 'bản ghi');
    
    // Xóa vườn
    await Garden.deleteOne({ _id: gardenId });
    console.log('Đã xóa vườn thành công');
    
    await mongoose.disconnect();
    console.log('Đã ngắt kết nối từ MongoDB');
  } catch (error) {
    console.error('Lỗi:', error.message);
    process.exit(1);
  }
}

deleteGarden();