const mongoose = require('mongoose');
const Garden = require('./models/Garden');

async function listGardens() {
  try {
    // Kết nối đến MongoDB
    await mongoose.connect('mongodb://localhost:27017/iot_garden');
    console.log('Đã kết nối đến MongoDB');
    
    // Lấy danh sách tất cả các vườn
    const gardens = await Garden.find({});
    
    console.log('Danh sách các vườn:');
    console.log('-------------------');
    
    if (gardens.length === 0) {
      console.log('Không có vườn nào trong cơ sở dữ liệu.');
    } else {
      gardens.forEach((garden, index) => {
        console.log(`${index + 1}. ID: ${garden._id}`);
        console.log(`   Tên: ${garden.name}`);
        console.log(`   Mô tả: ${garden.description || 'Không có'}`);
        console.log(`   Vị trí: ${garden.location || 'Không có'}`);
        console.log(`   Serial thiết bị: ${garden.device_serial}`);
        console.log(`   Chủ sở hữu ID: ${garden.user_id}`);
        console.log(`   Tạo lúc: ${garden.created_at}`);
        console.log(`   Kết nối cuối: ${garden.last_connected || 'Chưa kết nối'}`);
        console.log('-------------------');
      });
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Lỗi:', error.message);
    process.exit(1);
  }
}

listGardens(); 