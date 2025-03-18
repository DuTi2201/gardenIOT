const mongoose = require('mongoose');

const SensorDataSchema = new mongoose.Schema({
  garden_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garden',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  temperature: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number,
    required: true
  },
  light: {
    type: Number,
    required: true
  },
  soil: {
    type: Number,
    required: true
  },
  fan_status: {
    type: Boolean,
    default: false
  },
  light_status: {
    type: Boolean,
    default: false
  },
  pump_status: {
    type: Boolean,
    default: false
  },
  auto_mode: {
    type: Boolean,
    default: true
  }
});

// Tạo index cho truy vấn nhanh
SensorDataSchema.index({ garden_id: 1, timestamp: -1 });

module.exports = mongoose.model('SensorData', SensorDataSchema); 