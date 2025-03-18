const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng nhập tên đăng nhập'],
    unique: true,
    trim: true,
    minlength: [3, 'Tên đăng nhập phải có ít nhất 3 ký tự'],
    maxlength: [30, 'Tên đăng nhập không được vượt quá 30 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập địa chỉ email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Vui lòng nhập địa chỉ email hợp lệ'
    ]
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  last_login: {
    type: Date,
    default: null
  }
});

// Mã hóa mật khẩu trước khi lưu
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// So sánh mật khẩu
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 