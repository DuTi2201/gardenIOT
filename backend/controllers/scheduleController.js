const Schedule = require('../models/Schedule');
const logger = require('../utils/logger');
const { createResponse, formatTime, formatDays } = require('../utils/helpers');

// @desc    Lấy danh sách lịch trình
// @route   GET /api/gardens/:id/schedules
// @access  Private
exports.getSchedules = async (req, res) => {
  try {
    const gardenId = req.params.id;
    
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    
    const schedules = await Schedule.find({ garden_id: gardenId })
      .sort({ hour: 1, minute: 1 });
    
    res.json(createResponse(
      true, 
      'Lấy danh sách lịch trình thành công', 
      {
        count: schedules.length,
        schedules: schedules.map(schedule => ({
          id: schedule._id,
          device: schedule.device,
          action: schedule.action,
          time: formatTime(schedule.hour, schedule.minute),
          days: schedule.days,
          days_text: formatDays(schedule.days),
          active: schedule.active,
          created_at: schedule.created_at
        }))
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi lấy danh sách lịch trình: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Tạo lịch trình mới
// @route   POST /api/gardens/:id/schedules
// @access  Private
exports.createSchedule = async (req, res) => {
  try {
    const gardenId = req.params.id;
    const { device, action, hour, minute, days } = req.body;
    const userId = req.user.id;
    
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    
    // Tạo lịch trình mới
    const schedule = new Schedule({
      garden_id: gardenId,
      device,
      action,
      hour,
      minute,
      days,
      active: true,
      created_at: new Date(),
      created_by: userId
    });
    
    await schedule.save();
    
    logger.info(`Người dùng ${req.user.username} đã tạo lịch trình mới: ${device} ${action ? 'BẬT' : 'TẮT'} lúc ${formatTime(hour, minute)}`);
    
    res.status(201).json(createResponse(
      true, 
      'Tạo lịch trình thành công', 
      {
        schedule: {
          id: schedule._id,
          device: schedule.device,
          action: schedule.action,
          time: formatTime(schedule.hour, schedule.minute),
          days: schedule.days,
          days_text: formatDays(schedule.days),
          active: schedule.active,
          created_at: schedule.created_at
        }
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi tạo lịch trình: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Cập nhật lịch trình
// @route   PUT /api/gardens/:id/schedules/:scheduleId
// @access  Private
exports.updateSchedule = async (req, res) => {
  try {
    const { id: gardenId, scheduleId } = req.params;
    const { device, action, hour, minute, days, active } = req.body;
    
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    
    // Tìm lịch trình
    const schedule = await Schedule.findOne({
      _id: scheduleId,
      garden_id: gardenId
    });
    
    if (!schedule) {
      return res.status(404).json(createResponse(false, 'Không tìm thấy lịch trình'));
    }
    
    // Cập nhật thông tin
    if (device !== undefined) schedule.device = device;
    if (action !== undefined) schedule.action = action;
    if (hour !== undefined) schedule.hour = hour;
    if (minute !== undefined) schedule.minute = minute;
    if (days !== undefined) schedule.days = days;
    if (active !== undefined) schedule.active = active;
    
    await schedule.save();
    
    logger.info(`Người dùng ${req.user.username} đã cập nhật lịch trình: ${schedule.device} ${schedule.action ? 'BẬT' : 'TẮT'} lúc ${formatTime(schedule.hour, schedule.minute)}`);
    
    res.json(createResponse(
      true, 
      'Cập nhật lịch trình thành công', 
      {
        schedule: {
          id: schedule._id,
          device: schedule.device,
          action: schedule.action,
          time: formatTime(schedule.hour, schedule.minute),
          days: schedule.days,
          days_text: formatDays(schedule.days),
          active: schedule.active,
          created_at: schedule.created_at
        }
      }
    ));
    
  } catch (error) {
    logger.error(`Lỗi cập nhật lịch trình: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
};

// @desc    Xóa lịch trình
// @route   DELETE /api/gardens/:id/schedules/:scheduleId
// @access  Private
exports.deleteSchedule = async (req, res) => {
  try {
    const { id: gardenId, scheduleId } = req.params;
    
    // Thông tin vườn đã được kiểm tra quyền sở hữu từ middleware
    
    // Tìm và xóa lịch trình
    const schedule = await Schedule.findOneAndDelete({
      _id: scheduleId,
      garden_id: gardenId
    });
    
    if (!schedule) {
      return res.status(404).json(createResponse(false, 'Không tìm thấy lịch trình'));
    }
    
    logger.info(`Người dùng ${req.user.username} đã xóa lịch trình: ${schedule.device} ${schedule.action ? 'BẬT' : 'TẮT'} lúc ${formatTime(schedule.hour, schedule.minute)}`);
    
    res.json(createResponse(true, 'Xóa lịch trình thành công'));
    
  } catch (error) {
    logger.error(`Lỗi xóa lịch trình: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
}; 