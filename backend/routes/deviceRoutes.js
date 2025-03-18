const express = require('express');
const router = express.Router();
const { 
  getDevicesStatus, 
  controlDevice, 
  getDeviceHistory 
} = require('../controllers/deviceController');
const { protect, checkGardenOwnership } = require('../middleware/auth');

// Lấy trạng thái thiết bị
router.get('/:id/devices/status', protect, checkGardenOwnership, getDevicesStatus);

// Lấy lịch sử điều khiển thiết bị
router.get('/:id/devices/history', protect, checkGardenOwnership, getDeviceHistory);

// Điều khiển thiết bị
router.post('/:id/devices/:device/control', protect, checkGardenOwnership, controlDevice);

module.exports = router; 