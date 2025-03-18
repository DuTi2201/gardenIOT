const express = require('express');
const router = express.Router();
const { 
  getGardens, 
  createGarden, 
  getGardenById, 
  updateGarden, 
  deleteGarden, 
  updateGardenSettings, 
  getGardenStatus, 
  getLatestSensorData, 
  getSensorDataHistory,
  connectGarden,
  controlDevice,
  toggleAutoMode,
  getGardenSettings
} = require('../controllers/gardenController');
const { 
  uploadImage, 
  getGardenImages, 
  getLatestImage,
  requestCaptureImage 
} = require('../controllers/imageController');
const { protect, checkGardenOwnership } = require('../middleware/auth');
const { validateGarden, validateGardenSettings } = require('../middleware/validators');
const {
  analyzeGardenData,
  getAnalysisReports,
  getAnalysisReportDetail,
  applyAnalysisRecommendations,
  testGeminiConnection
} = require('../controllers/analysisController');
const multer = require('multer');

// Cấu hình multer lưu file tạm trong bộ nhớ
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
  },
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận file hình ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ tải lên hình ảnh'), false);
    }
  }
});

// Danh sách và tạo vườn mới
router.route('/')
  .get(protect, getGardens)
  .post(protect, validateGarden, createGarden);

// Kết nối vườn mới
router.post('/connect', protect, connectGarden);

// Quản lý vườn cụ thể
router.route('/:id')
  .get(protect, checkGardenOwnership, getGardenById)
  .put(protect, checkGardenOwnership, updateGarden)
  .delete(protect, checkGardenOwnership, deleteGarden);

// Cài đặt vườn
router.route('/:id/settings')
  .put(protect, checkGardenOwnership, validateGardenSettings, updateGardenSettings);

// Trạng thái kết nối
router.route('/:id/status')
  .get(protect, checkGardenOwnership, getGardenStatus);

// Dữ liệu cảm biến
router.route('/:id/data')
  .get(protect, checkGardenOwnership, getLatestSensorData);

// Lịch sử dữ liệu cảm biến
router.route('/:id/data/history')
  .get(protect, checkGardenOwnership, getSensorDataHistory);

// Phân tích dữ liệu vườn
router.route('/:id/analysis')
  .post(protect, checkGardenOwnership, analyzeGardenData)
  .get(protect, checkGardenOwnership, getAnalysisReports);

// Kiểm tra kết nối Gemini API
router.route('/:id/analysis/test-gemini')
  .get(protect, checkGardenOwnership, testGeminiConnection);

// Chi tiết báo cáo phân tích
router.route('/:id/analysis/:reportId')
  .get(protect, checkGardenOwnership, getAnalysisReportDetail);

// Áp dụng đề xuất phân tích
router.route('/:id/analysis/:reportId/apply')
  .post(protect, checkGardenOwnership, applyAnalysisRecommendations);

// Quản lý hình ảnh từ ESP32-Camera
router.route('/:id/images')
  .post(upload.single('image'), uploadImage)
  .get(protect, checkGardenOwnership, getGardenImages);

// Lấy hình ảnh mới nhất
router.route('/:id/images/latest')
  .get(protect, checkGardenOwnership, getLatestImage);

// Yêu cầu chụp ảnh
router.route('/:id/images/capture')
  .post(protect, checkGardenOwnership, requestCaptureImage);

module.exports = router; 