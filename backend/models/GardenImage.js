const mongoose = require('mongoose');

const GardenImageSchema = new mongoose.Schema({
  garden_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garden',
    required: true
  },
  image_url: {
    type: String,
    required: true
  },
  thumbnail_url: {
    type: String
  },
  webp_url: {
    type: String
  },
  capture_date: {
    type: Date,
    default: Date.now
  },
  analysis_results: {
    health_status: String,
    detected_issues: [String],
    confidence_score: Number,
    growth_stage: String,
    fruit_count: Number,
    analysis_date: Date
  },
  metadata: {
    width: Number,
    height: Number,
    format: String,
    light_level: Number,
    battery_level: Number
  },
  // Tự động xóa sau 30 ngày
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 30*24*60*60 // TTL index tự động xóa sau 30 ngày
  }
});

// Index để tối ưu việc tìm kiếm
GardenImageSchema.index({ garden_id: 1, capture_date: -1 });

module.exports = mongoose.model('GardenImage', GardenImageSchema); 