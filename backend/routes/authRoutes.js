const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validators');

// Đăng ký và đăng nhập
// Tắt tạm thời validator để debug
router.post('/register', /*validateRegister,*/ register);
router.post('/login', validateLogin, login);

// Quản lý thông tin người dùng (yêu cầu đăng nhập)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router; 