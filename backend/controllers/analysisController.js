const asyncHandler = require('express-async-handler');
const { analyzeSensorData, applyRecommendations } = require('../services/geminiService');
const { AnalysisReport } = require('../models/AnalysisReport');
const createResponse = require('../utils/responseUtils');
const logger = require('../utils/logger');

// @desc    Phân tích dữ liệu cảm biến của vườn
// @route   POST /api/gardens/:id/analysis
// @access  Private
exports.analyzeGardenData = asyncHandler(async (req, res) => {
  try {
    const gardenId = req.params.id;
    const { duration = '24h' } = req.body;
    
    logger.info(`Đang phân tích dữ liệu vườn ${gardenId} với thời gian ${duration}`);
    
    // Gọi service để phân tích dữ liệu
    const analysisResult = await analyzeSensorData(gardenId, {
      duration,
      includePreviousRecommendations: true
    });
    
    if (!analysisResult.success) {
      return res.status(400).json(createResponse(false, analysisResult.message));
    }
    
    res.json(createResponse(true, 'Phân tích dữ liệu thành công', {
      analysis: analysisResult.data,
      report_id: analysisResult.report_id
    }));
  } catch (error) {
    logger.error(`Lỗi phân tích dữ liệu vườn: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
});

// @desc    Lấy danh sách báo cáo phân tích
// @route   GET /api/gardens/:id/analysis
// @access  Private
exports.getAnalysisReports = asyncHandler(async (req, res) => {
  try {
    const gardenId = req.params.id;
    const { limit = 10, page = 1 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Lấy danh sách báo cáo
    const reports = await AnalysisReport
      .find({ garden_id: gardenId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum);
    
    // Đếm tổng số báo cáo
    const total = await AnalysisReport.countDocuments({ garden_id: gardenId });
    
    res.json(createResponse(true, 'Lấy danh sách báo cáo phân tích thành công', {
      reports,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }));
  } catch (error) {
    logger.error(`Lỗi lấy danh sách báo cáo phân tích: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
});

// @desc    Lấy chi tiết báo cáo phân tích
// @route   GET /api/gardens/:id/analysis/:reportId
// @access  Private
exports.getAnalysisReportDetail = asyncHandler(async (req, res) => {
  try {
    const reportId = req.params.reportId;
    
    // Lấy chi tiết báo cáo
    const report = await AnalysisReport.findById(reportId);
    
    if (!report) {
      return res.status(404).json(createResponse(false, 'Không tìm thấy báo cáo phân tích'));
    }
    
    // Kiểm tra quyền truy cập báo cáo
    if (report.garden_id.toString() !== req.params.id) {
      return res.status(403).json(createResponse(false, 'Bạn không có quyền truy cập báo cáo này'));
    }
    
    res.json(createResponse(true, 'Lấy chi tiết báo cáo phân tích thành công', { report }));
  } catch (error) {
    logger.error(`Lỗi lấy chi tiết báo cáo phân tích: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
});

// @desc    Áp dụng đề xuất từ báo cáo phân tích
// @route   POST /api/gardens/:id/analysis/:reportId/apply
// @access  Private
exports.applyAnalysisRecommendations = asyncHandler(async (req, res) => {
  try {
    const gardenId = req.params.id;
    const reportId = req.params.reportId;
    const { applyImmediately = true } = req.body;
    
    logger.info(`Đang áp dụng đề xuất từ báo cáo ${reportId} cho vườn ${gardenId}`);
    
    // Gọi service để áp dụng đề xuất
    const result = await applyRecommendations(gardenId, reportId, {
      applyImmediately,
      userId: req.user.id
    });
    
    if (!result.success) {
      return res.status(400).json(createResponse(false, result.message));
    }
    
    res.json(createResponse(true, 'Áp dụng đề xuất thành công', {
      actions: result.actions,
      schedules: result.schedules
    }));
  } catch (error) {
    logger.error(`Lỗi áp dụng đề xuất: ${error.message}`);
    res.status(500).json(createResponse(false, 'Lỗi server', { error: error.message }));
  }
});

// @desc    Kiểm tra kết nối Gemini API
// @route   GET /api/gardens/:id/analysis/test-gemini
// @access  Private
exports.testGeminiConnection = asyncHandler(async (req, res) => {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    logger.info('Đang kiểm tra kết nối Gemini API...');
    
    // Kiểm tra API key
    if (!process.env.GEMINI_API_KEY) {
      logger.error('GEMINI_API_KEY không được cấu hình trong file .env');
      return res.status(500).json(createResponse(false, 'GEMINI_API_KEY không được cấu hình'));
    }
    
    // Khởi tạo Gemini API Client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Gọi API Gemini với prompt đơn giản
    const prompt = "Hãy trả lời 'Kết nối thành công với Gemini API!' bằng tiếng Việt.";
    
    logger.info('Đang gửi prompt kiểm tra đến Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    logger.info(`Phản hồi từ Gemini API: ${text}`);
    
    res.json(createResponse(true, 'Kiểm tra kết nối Gemini API thành công', { response: text }));
  } catch (error) {
    logger.error(`Lỗi khi kiểm tra kết nối Gemini API: ${error.message}`);
    res.status(500).json(createResponse(false, `Lỗi kết nối Gemini API: ${error.message}`));
  }
}); 