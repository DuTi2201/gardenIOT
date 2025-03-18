const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  garden_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garden',
    required: true
  },
  device: {
    type: String,
    enum: ['FAN', 'LIGHT', 'PUMP'],
    required: true
  },
  action: {
    type: Boolean,
    required: true
  },
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },
  minute: {
    type: Number,
    required: true,
    min: 0,
    max: 59
  },
  days: {
    type: [Number],
    required: true,
    validate: {
      validator: function(days) {
        return days.length > 0 && days.every(day => day >= 0 && day <= 6);
      },
      message: 'Ngày trong tuần phải từ 0 (Chủ nhật) đến 6 (Thứ bảy)'
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    enum: ['USER', 'AI_RECOMMENDATION', 'SYSTEM'],
    default: 'USER'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Tạo index cho truy vấn nhanh
ScheduleSchema.index({ garden_id: 1, active: 1 });
ScheduleSchema.index({ hour: 1, minute: 1, days: 1, active: 1 });

module.exports = mongoose.model('Schedule', ScheduleSchema); 