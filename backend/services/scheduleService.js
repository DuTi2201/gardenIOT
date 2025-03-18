const Schedule = require('../models/Schedule');
const Garden = require('../models/Garden');
const DeviceHistory = require('../models/DeviceHistory');
const logger = require('../utils/logger');
const cron = require('node-cron');
const { formatTime } = require('../utils/helpers');

// Biến lưu trữ tham chiếu đến MQTT service
let mqttService;

// Khởi động dịch vụ lịch trình
const startScheduleService = (mqttServiceRef) => {
  logger.info('Khởi động dịch vụ lịch trình');
  
  // Lưu tham chiếu đến MQTT service
  mqttService = mqttServiceRef;
  
  // Chạy mỗi phút để kiểm tra lịch trình
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDay(); // 0 = Chủ nhật, 1-6 = Thứ hai đến thứ bảy
      
      logger.debug(`Kiểm tra lịch trình: ${currentHour}:${currentMinute}, ngày ${currentDay}`);
      
      // Tìm các lịch trình cần thực hiện
      const schedulesToRun = await Schedule.find({
        active: true,
        hour: currentHour,
        minute: currentMinute,
        days: currentDay
      }).populate('garden_id');
      
      if (schedulesToRun.length > 0) {
        logger.info(`Tìm thấy ${schedulesToRun.length} lịch trình cần thực hiện`);
      }
      
      // Thực hiện từng lịch trình
      for (const schedule of schedulesToRun) {
        await executeSchedule(schedule);
      }
    } catch (error) {
      logger.error(`Lỗi thực hiện lịch trình: ${error.message}`);
    }
  });
  
  logger.info('Dịch vụ lịch trình đã khởi động');
};

// Thực hiện lịch trình
const executeSchedule = async (schedule) => {
  try {
    const garden = schedule.garden_id;
    
    // Kiểm tra xem vườn có đang kết nối không
    if (!garden.isConnected()) {
      logger.warn(`Không thể thực hiện lịch trình cho vườn ${garden.name}: Vườn không được kết nối`);
      return;
    }
    
    logger.info(`Thực hiện lịch trình: ${schedule._id} - ${schedule.device} - ${schedule.action ? 'BẬT' : 'TẮT'} cho vườn ${garden.name}`);
    
    // Gửi lệnh thông qua MQTT
    await mqttService.sendCommand(
      garden._id,
      schedule.device,
      schedule.action,
      schedule.created_by
    );
    
    // Lưu lịch sử thiết bị
    const deviceHistory = new DeviceHistory({
      garden_id: garden._id,
      timestamp: new Date(),
      device: schedule.device,
      action: schedule.action ? 'ON' : 'OFF',
      source: 'SCHEDULE',
      user_id: schedule.created_by
    });
    
    await deviceHistory.save();
    
    logger.info(`Đã thực hiện lịch trình: ${schedule.device} ${schedule.action ? 'BẬT' : 'TẮT'} lúc ${formatTime(schedule.hour, schedule.minute)}`);
  } catch (error) {
    logger.error(`Lỗi thực hiện lịch trình ${schedule._id}: ${error.message}`);
  }
};

module.exports = {
  startScheduleService
}; 