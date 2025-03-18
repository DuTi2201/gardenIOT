const mongoose = require('mongoose');

// Schema cho báo cáo phân tích
const AnalysisReportSchema = new mongoose.Schema({
  garden_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garden',
    required: true,
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  data_period: {
    type: String,
    enum: ['24h', '7d', '30d'],
    default: '24h'
  },
  analysis_summary: {
    type: String,
    required: true
  },
  environmental_conditions: {
    temperature: String,
    humidity: String,
    light: String,
    soil: String
  },
  recommendations: {
    general: String,
    fan: {
      action: {
        type: String,
        enum: ['ON', 'OFF', 'UNKNOWN'],
        default: 'UNKNOWN'
      },
      schedule: String
    },
    light: {
      action: {
        type: String,
        enum: ['ON', 'OFF', 'UNKNOWN'],
        default: 'UNKNOWN'
      },
      schedule: String
    },
    pump: {
      action: {
        type: String,
        enum: ['ON', 'OFF', 'UNKNOWN'],
        default: 'UNKNOWN'
      },
      schedule: String
    }
  },
  actions_taken: [{
    device: {
      type: String,
      enum: ['FAN', 'LIGHT', 'PUMP', 'AUTO'],
      required: true
    },
    action: {
      type: String,
      enum: ['ON', 'OFF'],
      required: true
    },
    applied_at: {
      type: Date,
      default: Date.now
    },
    schedule: String
  }]
});

// Tạo index cho hiệu suất truy vấn
AnalysisReportSchema.index({ garden_id: 1, created_at: -1 });

// Tạo model
const AnalysisReport = mongoose.model('AnalysisReport', AnalysisReportSchema);

// Hàm tạo báo cáo phân tích
const createAnalysisReport = async (reportData) => {
  return await AnalysisReport.create(reportData);
};

// Hàm tìm báo cáo phân tích
const findAnalysisReports = (query) => {
  // Không sử dụng await ở đây để trả về đối tượng query
  return AnalysisReport.find(query);
};

// Hàm tìm báo cáo phân tích theo ID
const findAnalysisReportById = async (id) => {
  return await AnalysisReport.findById(id);
};

// Export model và helper functions
module.exports = {
  AnalysisReport,
  createAnalysisReport,
  findAnalysisReports,
  findAnalysisReportById
}; 