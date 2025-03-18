const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const SensorData = require('../models/SensorData');
const DeviceHistory = require('../models/DeviceHistory');
const { sendCommand } = require('./mqttService');
const Garden = require('../models/Garden');
const { createAnalysisReport, findAnalysisReports, findAnalysisReportById } = require('../models/AnalysisReport');

// Khởi tạo Gemini API Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Kiểm tra API key
if (!process.env.GEMINI_API_KEY) {
  logger.error('GEMINI_API_KEY không được cấu hình trong file .env');
} else {
  logger.info(`GEMINI_API_KEY đã được cấu hình (${process.env.GEMINI_API_KEY.substring(0, 5)}...)`);
}

/**
 * Phân tích dữ liệu cảm biến từ vườn và cung cấp phân tích, đề xuất
 * @param {String} gardenId - ID của vườn cần phân tích
 * @param {Object} options - Các tùy chọn để điều chỉnh cách phân tích
 * @returns {Object} - Kết quả phân tích
 */
const analyzeSensorData = async (gardenId, options = {}) => {
  try {
    const { duration = '24h', includePreviousRecommendations = true } = options;
    
    logger.info(`Bắt đầu phân tích dữ liệu cho vườn ${gardenId} với thời gian ${duration}`);
    
    // Lấy thông tin cài đặt vườn
    const garden = await Garden.findById(gardenId);
    if (!garden) {
      logger.error(`Không tìm thấy vườn với ID ${gardenId}`);
      throw new Error('Không tìm thấy vườn');
    }
    
    logger.info(`Đã tìm thấy vườn: ${garden.name}`);

    // Tạo bộ lọc thời gian
    let timeFilter = new Date();
    if (duration === '24h') {
      timeFilter.setHours(timeFilter.getHours() - 24);
    } else if (duration === '7d') {
      timeFilter.setDate(timeFilter.getDate() - 7);
    } else if (duration === '30d') {
      timeFilter.setDate(timeFilter.getDate() - 30);
    }

    // Lấy dữ liệu cảm biến gần đây
    const sensorData = await SensorData
      .find({ garden_id: gardenId, timestamp: { $gte: timeFilter } })
      .sort({ timestamp: 1 });
    
    logger.info(`Đã tìm thấy ${sensorData.length} mẫu dữ liệu cảm biến`);
    
    if (sensorData.length === 0) {
      logger.error(`Không có dữ liệu cảm biến cho vườn ${gardenId}`);
      return {
        success: false,
        message: 'Không có đủ dữ liệu để phân tích',
        data: null
      };
    }

    // Lấy các đề xuất trước đó (nếu cần)
    let previousRecommendations = [];
    if (includePreviousRecommendations) {
      try {
        logger.info(`Đang tìm các đề xuất trước đó cho vườn ${gardenId}`);
        const previousAnalyses = await findAnalysisReports({ garden_id: gardenId })
          .sort({ created_at: -1 })
          .limit(3);
        
        logger.info(`Đã tìm thấy ${previousAnalyses.length} đề xuất trước đó`);
        previousRecommendations = previousAnalyses.map(a => a.recommendations);
      } catch (error) {
        logger.error(`Lỗi khi tìm đề xuất trước đó: ${error.message}`);
        // Tiếp tục mà không có đề xuất trước đó
        previousRecommendations = [];
      }
    }

    // Chuẩn bị dữ liệu để gửi tới Gemini
    const prompt = preparePromptForGemini(garden, sensorData, previousRecommendations);
    logger.info('Đã chuẩn bị prompt cho Gemini API');
    
    // Gọi API Gemini
    logger.info('Đang gọi Gemini API...');
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      logger.info('Đã nhận phản hồi từ Gemini API');
      
      // Phân tích kết quả từ Gemini
      const parsedResult = parseGeminiResponse(analysisText);
      logger.info('Đã phân tích phản hồi từ Gemini API');

      // Lưu báo cáo phân tích
      const analysisReport = await createAnalysisReport({
        garden_id: gardenId,
        data_period: duration,
        analysis_summary: parsedResult.summary,
        environmental_conditions: parsedResult.conditions,
        recommendations: parsedResult.recommendations,
        actions_taken: [],
        created_at: new Date()
      });

      return {
        success: true,
        message: 'Phân tích dữ liệu thành công',
        data: parsedResult,
        report_id: analysisReport._id
      };
    } catch (error) {
      logger.error(`Lỗi khi gọi Gemini API: ${error.message}`);
      throw new Error(`Lỗi khi gọi Gemini API: ${error.message}`);
    }
  } catch (error) {
    logger.error(`Lỗi khi phân tích dữ liệu cảm biến: ${error.message}`);
    return {
      success: false,
      message: `Lỗi khi phân tích: ${error.message}`,
      data: null
    };
  }
};

/**
 * Chuẩn bị nội dung prompt để gửi tới Gemini
 */
const preparePromptForGemini = (garden, sensorData, previousRecommendations) => {
  // Tính toán các chỉ số thống kê
  const stats = calculateSensorStats(sensorData);
  
  // Tổng hợp ngưỡng thiết lập
  const thresholds = {
    temperature: {
      low: garden.settings.temperature_threshold_low,
      high: garden.settings.temperature_threshold_high
    },
    humidity: {
      low: garden.settings.humidity_threshold_low,
      high: garden.settings.humidity_threshold_high
    },
    light: {
      low: garden.settings.light_threshold_low,
      high: garden.settings.light_threshold_high
    },
    soil: {
      low: garden.settings.soil_threshold_low,
      high: garden.settings.soil_threshold_high
    }
  };

  // Tạo prompt
  return `Bạn là một chuyên gia nông nghiệp và IoT. Hãy phân tích dữ liệu từ vườn thông minh và đưa ra đề xuất.

THÔNG TIN VƯỜN:
Tên: ${garden.name}
Vị trí: ${garden.location}
Mô tả: ${garden.description}

DỮ LIỆU MÔI TRƯỜNG (${sensorData.length} mẫu):
Nhiệt độ (°C): Trung bình=${stats.temperature.avg.toFixed(1)}, Min=${stats.temperature.min}, Max=${stats.temperature.max}, Xu hướng=${stats.temperature.trend}
Độ ẩm không khí (%): Trung bình=${stats.humidity.avg.toFixed(1)}, Min=${stats.humidity.min}, Max=${stats.humidity.max}, Xu hướng=${stats.humidity.trend}
Ánh sáng (%): Trung bình=${stats.light.avg.toFixed(1)}, Min=${stats.light.min}, Max=${stats.light.max}, Xu hướng=${stats.light.trend}
Độ ẩm đất (%): Trung bình=${stats.soil.avg.toFixed(1)}, Min=${stats.soil.min}, Max=${stats.soil.max}, Xu hướng=${stats.soil.trend}

NGƯỠNG CÀI ĐẶT:
Nhiệt độ (°C): Thấp=${thresholds.temperature.low}, Cao=${thresholds.temperature.high}
Độ ẩm không khí (%): Thấp=${thresholds.humidity.low}, Cao=${thresholds.humidity.high}
Ánh sáng (%): Thấp=${thresholds.light.low}, Cao=${thresholds.light.high}
Độ ẩm đất (%): Thấp=${thresholds.soil.low}, Cao=${thresholds.soil.high}

${previousRecommendations.length > 0 ? `ĐỀ XUẤT TRƯỚC ĐÓ:\n${previousRecommendations.join('\n')}` : ''}

YÊU CẦU:
1. Phân tích tóm tắt điều kiện môi trường hiện tại của vườn 
2. Đánh giá chi tiết từng thông số (nhiệt độ, độ ẩm không khí, ánh sáng, độ ẩm đất)
3. Đưa ra đề xuất cụ thể cho việc chăm sóc vườn, bao gồm:
   - Có nên bật/tắt quạt không? Thời điểm nào?
   - Có nên bật/tắt đèn không? Thời điểm nào?
   - Có nên bật/tắt máy bơm không? Thời điểm nào?
   - Các đề xuất bổ sung về chăm sóc
4. Đề xuất lịch trình tự động cho 24 giờ tới

Định dạng JSON phản hồi:
{
  "summary": "Tóm tắt tình trạng vườn",
  "conditions": {
    "temperature": "Phân tích nhiệt độ",
    "humidity": "Phân tích độ ẩm không khí",
    "light": "Phân tích ánh sáng",
    "soil": "Phân tích độ ẩm đất"
  },
  "recommendations": {
    "general": "Đề xuất chung",
    "fan": {"action": "ON/OFF", "schedule": "6:00-8:00, 12:00-14:00"},
    "light": {"action": "ON/OFF", "schedule": "18:00-22:00"},
    "pump": {"action": "ON/OFF", "schedule": "7:00, 18:00"}
  }
}`;
};

/**
 * Phân tích phản hồi từ Gemini API
 */
const parseGeminiResponse = (responseText) => {
  try {
    // Tìm JSON trong phản hồi
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Nếu không tìm thấy JSON, trả về một phân tích đơn giản
    return {
      summary: "Không thể phân tích cấu trúc phản hồi",
      conditions: {
        temperature: "Không có dữ liệu",
        humidity: "Không có dữ liệu",
        light: "Không có dữ liệu",
        soil: "Không có dữ liệu"
      },
      recommendations: {
        general: responseText,
        fan: { action: "UNKNOWN", schedule: "" },
        light: { action: "UNKNOWN", schedule: "" },
        pump: { action: "UNKNOWN", schedule: "" }
      }
    };
  } catch (error) {
    logger.error(`Lỗi khi xử lý phản hồi từ Gemini: ${error.message}`);
    return {
      summary: "Lỗi khi xử lý phản hồi",
      conditions: {
        temperature: "Lỗi xử lý",
        humidity: "Lỗi xử lý",
        light: "Lỗi xử lý",
        soil: "Lỗi xử lý"
      },
      recommendations: {
        general: "Không thể xử lý đề xuất do lỗi hệ thống",
        fan: { action: "UNKNOWN", schedule: "" },
        light: { action: "UNKNOWN", schedule: "" },
        pump: { action: "UNKNOWN", schedule: "" }
      }
    };
  }
};

/**
 * Tính toán các chỉ số thống kê từ dữ liệu cảm biến
 */
const calculateSensorStats = (sensorData) => {
  // Khởi tạo kết quả
  const result = {
    temperature: { min: Infinity, max: -Infinity, avg: 0, trend: "stable" },
    humidity: { min: Infinity, max: -Infinity, avg: 0, trend: "stable" },
    light: { min: Infinity, max: -Infinity, avg: 0, trend: "stable" },
    soil: { min: Infinity, max: -Infinity, avg: 0, trend: "stable" }
  };
  
  // Không đủ dữ liệu để phân tích
  if (sensorData.length === 0) return result;
  
  // Tính toán min, max, avg
  sensorData.forEach(data => {
    // Nhiệt độ
    result.temperature.min = Math.min(result.temperature.min, data.temperature);
    result.temperature.max = Math.max(result.temperature.max, data.temperature);
    result.temperature.avg += data.temperature;
    
    // Độ ẩm không khí
    result.humidity.min = Math.min(result.humidity.min, data.humidity);
    result.humidity.max = Math.max(result.humidity.max, data.humidity);
    result.humidity.avg += data.humidity;
    
    // Ánh sáng
    result.light.min = Math.min(result.light.min, data.light);
    result.light.max = Math.max(result.light.max, data.light);
    result.light.avg += data.light;
    
    // Độ ẩm đất
    result.soil.min = Math.min(result.soil.min, data.soil);
    result.soil.max = Math.max(result.soil.max, data.soil);
    result.soil.avg += data.soil;
  });
  
  // Hoàn thiện các giá trị trung bình
  result.temperature.avg /= sensorData.length;
  result.humidity.avg /= sensorData.length;
  result.light.avg /= sensorData.length;
  result.soil.avg /= sensorData.length;
  
  // Phân tích xu hướng (nếu có đủ dữ liệu)
  if (sensorData.length >= 5) {
    const recentData = sensorData.slice(-5);
    
    // Xu hướng nhiệt độ
    const tempTrend = analyzeTrend(recentData.map(d => d.temperature));
    result.temperature.trend = tempTrend;
    
    // Xu hướng độ ẩm không khí
    const humidityTrend = analyzeTrend(recentData.map(d => d.humidity));
    result.humidity.trend = humidityTrend;
    
    // Xu hướng ánh sáng
    const lightTrend = analyzeTrend(recentData.map(d => d.light));
    result.light.trend = lightTrend;
    
    // Xu hướng độ ẩm đất
    const soilTrend = analyzeTrend(recentData.map(d => d.soil));
    result.soil.trend = soilTrend;
  }
  
  return result;
};

/**
 * Phân tích xu hướng của dữ liệu
 */
const analyzeTrend = (values) => {
  if (values.length < 3) return "không đủ dữ liệu";
  
  // Tính sự chênh lệch giữa các điểm dữ liệu
  let increases = 0;
  let decreases = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i-1]) {
      increases++;
    } else if (values[i] < values[i-1]) {
      decreases++;
    }
  }
  
  // Xác định xu hướng
  if (increases > decreases && increases >= values.length * 0.6) {
    return "tăng";
  } else if (decreases > increases && decreases >= values.length * 0.6) {
    return "giảm";
  } else {
    return "ổn định";
  }
};

/**
 * Áp dụng đề xuất tự động cho vườn
 * @param {String} gardenId - ID của vườn
 * @param {String} reportId - ID của báo cáo phân tích
 * @param {Object} options - Các tùy chọn để điều chỉnh việc áp dụng
 */
const applyRecommendations = async (gardenId, reportId, options = {}) => {
  try {
    const { applyImmediately = true, userId = null } = options;
    
    // Lấy báo cáo phân tích
    const report = await findAnalysisReportById(reportId);
    if (!report || report.garden_id.toString() !== gardenId) {
      throw new Error('Không tìm thấy báo cáo phân tích phù hợp');
    }

    const actions = [];

    // Áp dụng các đề xuất ngay lập tức nếu được yêu cầu
    if (applyImmediately) {
      // Đề xuất quạt
      if (report.recommendations.fan && report.recommendations.fan.action) {
        const fanAction = report.recommendations.fan.action === 'ON';
        await sendCommand(gardenId, 'FAN', fanAction, userId);
        actions.push({
          device: 'FAN',
          action: fanAction ? 'ON' : 'OFF',
          applied_at: new Date(),
          schedule: report.recommendations.fan.schedule
        });
      }
      
      // Đề xuất đèn
      if (report.recommendations.light && report.recommendations.light.action) {
        const lightAction = report.recommendations.light.action === 'ON';
        await sendCommand(gardenId, 'LIGHT', lightAction, userId);
        actions.push({
          device: 'LIGHT',
          action: lightAction ? 'ON' : 'OFF',
          applied_at: new Date(),
          schedule: report.recommendations.light.schedule
        });
      }
      
      // Đề xuất máy bơm
      if (report.recommendations.pump && report.recommendations.pump.action) {
        const pumpAction = report.recommendations.pump.action === 'ON';
        await sendCommand(gardenId, 'PUMP', pumpAction, userId);
        actions.push({
          device: 'PUMP',
          action: pumpAction ? 'ON' : 'OFF',
          applied_at: new Date(),
          schedule: report.recommendations.pump.schedule
        });
      }
    }

    // Cập nhật báo cáo với các hành động đã thực hiện
    if (actions.length > 0) {
      report.actions_taken = actions;
      await report.save();
    }

    // Tạo lịch trình tự động dựa trên đề xuất
    const schedules = await createSchedulesFromRecommendations(
      gardenId, 
      report.recommendations, 
      userId
    );

    // Hiển thị thông tin chi tiết cho gỡ lỗi
    logger.info(`Kết quả áp dụng đề xuất: ${actions.length} hành động, ${schedules.length} lịch trình`);
    if (schedules.length > 0) {
      logger.info(`Chi tiết lịch trình: ${JSON.stringify(schedules)}`);
    }

    return {
      success: true,
      message: 'Áp dụng đề xuất thành công',
      actions,
      schedules
    };
  } catch (error) {
    logger.error(`Lỗi khi áp dụng đề xuất: ${error.message}`);
    return {
      success: false,
      message: `Lỗi khi áp dụng đề xuất: ${error.message}`,
      actions: [],
      schedules: []
    };
  }
};

/**
 * Tạo lịch trình từ các đề xuất
 */
const createSchedulesFromRecommendations = async (gardenId, recommendations, userId) => {
  try {
    logger.info(`Đang tạo lịch trình từ đề xuất cho vườn ${gardenId}`);
    logger.info(`Nội dung đề xuất: ${JSON.stringify(recommendations)}`);
    
    const schedules = [];
    const Schedule = require('../models/Schedule');

    // Xử lý đề xuất cho quạt
    if (recommendations.fan && recommendations.fan.schedule) {
      logger.info(`Xử lý đề xuất lịch trình quạt: ${recommendations.fan.schedule}`);
      
      // Tạo các lịch trình cho quạt
      const fanSchedules = await createMultipleSchedules(
        gardenId, 
        'FAN', 
        recommendations.fan.schedule, 
        recommendations.fan.action === 'ON', 
        userId
      );
      
      if (fanSchedules.length > 0) {
        logger.info(`Đã tạo ${fanSchedules.length} lịch trình quạt`);
        schedules.push(...fanSchedules);
      } else {
        logger.warn(`Không tạo được lịch trình quạt từ: ${recommendations.fan.schedule}`);
      }
    } else {
      logger.info('Không có đề xuất lịch trình cho quạt');
    }

    // Xử lý đề xuất cho đèn
    if (recommendations.light && recommendations.light.schedule) {
      logger.info(`Xử lý đề xuất lịch trình đèn: ${recommendations.light.schedule}`);
      
      // Tạo các lịch trình cho đèn
      const lightSchedules = await createMultipleSchedules(
        gardenId, 
        'LIGHT', 
        recommendations.light.schedule, 
        recommendations.light.action === 'ON', 
        userId
      );
      
      if (lightSchedules.length > 0) {
        logger.info(`Đã tạo ${lightSchedules.length} lịch trình đèn`);
        schedules.push(...lightSchedules);
      } else {
        logger.warn(`Không tạo được lịch trình đèn từ: ${recommendations.light.schedule}`);
      }
    } else {
      logger.info('Không có đề xuất lịch trình cho đèn');
    }

    // Xử lý đề xuất cho máy bơm
    if (recommendations.pump && recommendations.pump.schedule) {
      logger.info(`Xử lý đề xuất lịch trình máy bơm: ${recommendations.pump.schedule}`);
      
      // Tạo các lịch trình cho máy bơm
      const pumpSchedules = await createMultipleSchedules(
        gardenId, 
        'PUMP', 
        recommendations.pump.schedule, 
        recommendations.pump.action === 'ON', 
        userId
      );
      
      if (pumpSchedules.length > 0) {
        logger.info(`Đã tạo ${pumpSchedules.length} lịch trình máy bơm`);
        schedules.push(...pumpSchedules);
      } else {
        logger.warn(`Không tạo được lịch trình máy bơm từ: ${recommendations.pump.schedule}`);
      }
    } else {
      logger.info('Không có đề xuất lịch trình cho máy bơm');
    }

    // Tự động bật chế độ AUTO nếu có lịch trình được tạo
    if (schedules.length > 0) {
      const mqttService = require('./mqttService');
      await mqttService.sendCommand(gardenId, 'AUTO', true, userId);
      
      // Lưu lịch sử điều khiển
      const DeviceHistory = require('../models/DeviceHistory');
      const deviceHistory = new DeviceHistory({
        garden_id: gardenId,
        timestamp: new Date(),
        device: 'AUTO',
        action: 'ON',
        source: 'AI_RECOMMENDATION',
        user_id: userId
      });
      
      await deviceHistory.save();
      logger.info(`Đã tự động bật chế độ AUTO cho vườn ${gardenId} từ đề xuất AI`);
    } else {
      logger.warn(`Không có lịch trình nào được tạo từ đề xuất cho vườn ${gardenId}`);
    }

    logger.info(`Tổng cộng đã tạo ${schedules.length} lịch trình từ đề xuất AI`);
    return schedules;
  } catch (error) {
    logger.error(`Lỗi khi tạo lịch trình từ đề xuất: ${error.message}`);
    return [];
  }
};

/**
 * Tạo nhiều lịch trình từ một chuỗi đề xuất
 * @param {String} gardenId - ID của vườn
 * @param {String} device - Loại thiết bị (FAN, LIGHT, PUMP)
 * @param {String} scheduleStr - Chuỗi lịch trình từ đề xuất
 * @param {Boolean} action - Trạng thái thiết bị (true = BẬT, false = TẮT)
 * @param {String} userId - ID người dùng
 * @returns {Array} - Danh sách lịch trình đã tạo
 */
const createMultipleSchedules = async (gardenId, device, scheduleStr, action, userId) => {
  const createdSchedules = [];
  const Schedule = require('../models/Schedule');
  const mongoose = require('mongoose');

  try {
    // Kiểm tra lịch trình không muốn bật thiết bị
    if (scheduleStr.toLowerCase().includes('không cần') || 
        scheduleStr.toLowerCase().includes('không nên') ||
        scheduleStr.toLowerCase().includes('không khuyến nghị')) {
      logger.info(`Lịch trình ${device} không khuyến nghị bật, bỏ qua`);
      return createdSchedules;
    }

    // Đảm bảo gardenId là ObjectID hợp lệ
    const objectIdGardenId = mongoose.Types.ObjectId.isValid(gardenId) 
      ? new mongoose.Types.ObjectId(gardenId) 
      : gardenId;

    // Kiểm tra nếu lịch trình đã tồn tại để tránh lặp lại
    const existingSchedules = await Schedule.find({ 
      garden_id: objectIdGardenId,
      device: device,
      source: 'AI_RECOMMENDATION'
    });
    
    if (existingSchedules.length > 0) {
      logger.info(`Đã có ${existingSchedules.length} lịch trình ${device} cho vườn này, xóa để tránh trùng lặp`);
      // Xóa các lịch trình cũ từ AI
      await Schedule.deleteMany({ 
        garden_id: objectIdGardenId,
        device: device,
        source: 'AI_RECOMMENDATION'
      });
    }
    
    // Xử lý lịch trình nhiều thời điểm (ví dụ: "7:00, 9:00, 11:00")
    // Kiểm tra dấu phẩy trong phần đầu của chuỗi lịch trình (trước dấu chấm)
    const mainSchedulePart = scheduleStr.split('.')[0];
    const timeStrings = mainSchedulePart.split(',');
    
    // Nếu có nhiều thời điểm được phân tách bằng dấu phẩy
    if (timeStrings.length > 1) {
      logger.info(`Phát hiện ${timeStrings.length} thời điểm lịch trình cho ${device}`);
      
      for (const timeStr of timeStrings) {
        // Tạo chuỗi giả lập để phân tích
        const simulatedTimeStr = timeStr.trim();
        if (!simulatedTimeStr) continue;
        
        const scheduleData = parseScheduleString(simulatedTimeStr);
        if (scheduleData) {
          // Tạo lịch trình cho thời điểm này
          const schedule = new Schedule({
            garden_id: objectIdGardenId,
            device,
            action,
            hour: scheduleData.hour,
            minute: scheduleData.minute,
            days: scheduleData.days || [0, 1, 2, 3, 4, 5, 6],
            active: true,
            created_at: new Date(),
            created_by: userId,
            source: 'AI_RECOMMENDATION'
          });
          
          await schedule.save();
          createdSchedules.push({
            id: schedule._id,
            device,
            action,
            time: `${scheduleData.hour}:${scheduleData.minute.toString().padStart(2, '0')}`,
            days: scheduleData.days || [0, 1, 2, 3, 4, 5, 6]
          });
          
          logger.info(`Đã tạo lịch trình ${device} lúc ${scheduleData.hour}:${scheduleData.minute}`);
        }
      }
    } else {
      // Xử lý trường hợp một thời điểm
      const scheduleData = parseScheduleString(scheduleStr);
      if (scheduleData) {
        const schedule = new Schedule({
          garden_id: objectIdGardenId,
          device,
          action,
          hour: scheduleData.hour,
          minute: scheduleData.minute,
          days: scheduleData.days || [0, 1, 2, 3, 4, 5, 6],
          active: true,
          created_at: new Date(),
          created_by: userId,
          source: 'AI_RECOMMENDATION'
        });
        
        await schedule.save();
        createdSchedules.push({
          id: schedule._id,
          device,
          action,
          time: `${scheduleData.hour}:${scheduleData.minute.toString().padStart(2, '0')}`,
          days: scheduleData.days || [0, 1, 2, 3, 4, 5, 6]
        });
        
        logger.info(`Đã tạo lịch trình ${device} lúc ${scheduleData.hour}:${scheduleData.minute}`);
      } else {
        logger.warn(`Không thể phân tích được lịch trình từ chuỗi: "${scheduleStr}"`);
      }
    }
    
    return createdSchedules;
  } catch (error) {
    logger.error(`Lỗi khi tạo nhiều lịch trình: ${error.message}`);
    return createdSchedules;
  }
};

/**
 * Phân tích chuỗi lịch trình từ đề xuất AI
 * Format dự kiến có thể phức tạp như: 
 * - "7:00 AM hàng ngày"
 * - "6:00-18:00. Duy trì ánh sáng nhân tạo..."
 * - "7:00, 9:00, 11:00, 13:00, 15:00, 17:00. Tưới nước nhiều lần..."
 */
const parseScheduleString = (scheduleStr) => {
  try {
    logger.info(`Đang phân tích chuỗi lịch trình: "${scheduleStr}"`);
    
    // Xử lý các trường hợp chuỗi lịch trình
    if (!scheduleStr) {
      logger.warn('Chuỗi lịch trình rỗng, bỏ qua');
      return null;
    }

    // Bỏ qua các lịch trình như "Không cần bật quạt..."
    if (scheduleStr.toLowerCase().includes('không cần') || 
        scheduleStr.toLowerCase().includes('không nên')) {
      logger.info('Phát hiện đề xuất không bật thiết bị, bỏ qua tạo lịch trình');
      return null;
    }
    
    // Tách phần mô tả khỏi phần thời gian (thường cách nhau bởi dấu chấm)
    const firstPartMatch = scheduleStr.split(/\.\s/)[0];
    logger.info(`Phần thời gian sau khi tách: "${firstPartMatch}"`);
    
    // Xử lý dạng khoảng thời gian "6:00-18:00" - lấy thời gian đầu tiên
    let processedTimeStr = firstPartMatch;
    if (firstPartMatch.includes('-')) {
      // Chỉ lấy thời gian bắt đầu từ khoảng
      processedTimeStr = firstPartMatch.split('-')[0].trim();
      logger.info(`Phát hiện khoảng thời gian, chọn thời điểm bắt đầu: ${processedTimeStr}`);
    }
    
    // Trích xuất thời gian đầu tiên tìm thấy
    // Hỗ trợ định dạng như "7:00", "7h00", "7h", "7:00 AM", "7:00-9:00", v.v.
    const timeRegex = /(\d{1,2})[:hg](\d{2})?(?:\s*(AM|PM))?/i;
    const timeMatch = processedTimeStr.match(timeRegex);
    
    if (!timeMatch) {
      logger.warn(`Không thể phân tích được thời gian từ: "${scheduleStr}"`);
      return null;
    }
    
    let hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : null;
    
    // Xử lý AM/PM nếu có
    if (ampm === 'PM' && hour < 12) {
      hour += 12;
    } else if (ampm === 'AM' && hour === 12) {
      hour = 0;
    }

    // Nếu lịch trình có nhiều thời điểm, thông báo để xử lý ở hàm khác
    if (firstPartMatch.includes(',')) {
      logger.info(`Phát hiện nhiều thời điểm, đã xử lý thời điểm đầu tiên: ${hour}:${minute}`);
    }
    
    // Xác định các ngày trong tuần
    const days = [];
    
    // Mặc định là mỗi ngày nếu có từ "hàng ngày" hoặc "mỗi ngày"
    if (
      scheduleStr.includes('hàng ngày') || 
      scheduleStr.includes('mỗi ngày') ||
      scheduleStr.includes('daily') ||
      scheduleStr.includes('every day')
    ) {
      days.push(0, 1, 2, 3, 4, 5, 6); // Chủ nhật và các ngày trong tuần
    }
    // Ngày trong tuần (không bao gồm cuối tuần)
    else if (
      scheduleStr.includes('trong tuần') || 
      scheduleStr.includes('ngày làm việc') ||
      scheduleStr.includes('weekdays')
    ) {
      days.push(1, 2, 3, 4, 5); // Thứ 2 đến thứ 6
    }
    // Chỉ cuối tuần
    else if (
      scheduleStr.includes('cuối tuần') || 
      scheduleStr.includes('weekend')
    ) {
      days.push(0, 6); // Chủ nhật và thứ 7
    }
    // Mặc định là mỗi ngày nếu không xác định được
    else {
      days.push(0, 1, 2, 3, 4, 5, 6);
    }
    
    logger.info(`Đã phân tích lịch trình: Giờ=${hour}, Phút=${minute}, Các ngày=[${days.join(',')}]`);
    
    return {
      hour,
      minute,
      days
    };
  } catch (error) {
    logger.error(`Lỗi khi phân tích chuỗi lịch trình: ${error.message}`);
    return null;
  }
};

module.exports = {
  analyzeSensorData,
  applyRecommendations,
  parseScheduleString,
  createSchedulesFromRecommendations
}; 