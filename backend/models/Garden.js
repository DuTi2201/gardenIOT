const mongoose = require('mongoose');

const GardenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên vườn'],
    trim: true,
    maxlength: [50, 'Tên vườn không được vượt quá 50 ký tự']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Mô tả không được vượt quá 200 ký tự']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Vị trí không được vượt quá 100 ký tự']
  },
  device_serial: {
    type: String,
    required: [true, 'Vui lòng nhập mã serial thiết bị'],
    unique: true,
    trim: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  last_connected: {
    type: Date,
    default: null
  },
  settings: {
    auto_mode: {
      type: Boolean,
      default: true
    },
    temperature_threshold_high: {
      type: Number,
      default: 30
    },
    temperature_threshold_low: {
      type: Number,
      default: 28
    },
    humidity_threshold_high: {
      type: Number,
      default: 70
    },
    humidity_threshold_low: {
      type: Number,
      default: 50
    },
    light_threshold_high: {
      type: Number,
      default: 50
    },
    light_threshold_low: {
      type: Number,
      default: 30
    },
    soil_threshold_high: {
      type: Number,
      default: 60
    },
    soil_threshold_low: {
      type: Number,
      default: 30
    }
  }
});

// Phương thức kiểm tra trạng thái kết nối
GardenSchema.methods.isConnected = function() {
  if (!this.last_connected) {
    console.log(`Garden Debug (${this._id}): last_connected là null hoặc undefined`);
    return false;
  }
  
  // Vườn được xem là đang kết nối nếu thời gian cuối cùng kết nối trong vòng 5 phút
  const FIVE_MINUTES = 5 * 60 * 1000;
  const lastConnectedTime = this.last_connected.getTime();
  const currentTime = Date.now();
  const timeDiff = currentTime - lastConnectedTime;
  
  console.log(`Garden Debug (${this._id}): last_connected = ${this.last_connected}`);
  console.log(`Garden Debug (${this._id}): currentTime = ${new Date(currentTime)}`);
  console.log(`Garden Debug (${this._id}): timeDiff = ${timeDiff}ms (${Math.round(timeDiff/1000/60)} phút)`);
  console.log(`Garden Debug (${this._id}): FIVE_MINUTES = ${FIVE_MINUTES}ms (5 phút)`);
  console.log(`Garden Debug (${this._id}): isConnected = ${timeDiff < FIVE_MINUTES}`);
  
  return timeDiff < FIVE_MINUTES;
};

module.exports = mongoose.model('Garden', GardenSchema); 