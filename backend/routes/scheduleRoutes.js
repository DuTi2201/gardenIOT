const express = require('express');
const router = express.Router();
const { 
  getSchedules, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule 
} = require('../controllers/scheduleController');
const { protect, checkGardenOwnership } = require('../middleware/auth');
const { validateSchedule } = require('../middleware/validators');

// Lấy danh sách và tạo lịch trình
router.route('/:id/schedules')
  .get(protect, checkGardenOwnership, getSchedules)
  .post(protect, checkGardenOwnership, validateSchedule, createSchedule);

// Cập nhật và xóa lịch trình
router.route('/:id/schedules/:scheduleId')
  .put(protect, checkGardenOwnership, updateSchedule)
  .delete(protect, checkGardenOwnership, deleteSchedule);

module.exports = router; 