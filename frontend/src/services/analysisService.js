import axios from '../utils/api';

// Yêu cầu phân tích dữ liệu vườn
export const requestAnalysis = async (gardenId, options = {}) => {
  try {
    const { duration = '24h' } = options;
    console.log(`Gửi request phân tích đến API với gardenId=${gardenId}, duration=${duration}`);
    
    const response = await axios.post(`/gardens/${gardenId}/analysis`, { duration });
    console.log('Phản hồi gốc từ API:', response);
    
    // Đảm bảo phản hồi có cấu trúc đúng
    if (response.success === false) {
      return response; // Trả về lỗi từ API
    }
    
    // Trả về dữ liệu phân tích
    return response;
  } catch (error) {
    console.error('Lỗi khi gọi API phân tích:', error);
    console.error('Chi tiết lỗi:', error.response?.data);
    
    // Trả về lỗi với cấu trúc chuẩn
    throw error.response?.data || { 
      success: false, 
      message: error.message || 'Lỗi khi yêu cầu phân tích dữ liệu' 
    };
  }
};

// Lấy danh sách báo cáo phân tích
export const getAnalysisReports = async (gardenId, options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;
    console.log(`Gửi request lấy danh sách báo cáo với gardenId=${gardenId}, page=${page}, limit=${limit}`);
    
    const response = await axios.get(`/gardens/${gardenId}/analysis`, {
      params: { page, limit }
    });
    console.log('Phản hồi từ API getAnalysisReports:', response);
    
    return response;
  } catch (error) {
    console.error('Lỗi khi gọi API lấy danh sách báo cáo:', error);
    throw error.response?.data || { 
      success: false, 
      message: error.message || 'Lỗi khi lấy danh sách báo cáo phân tích' 
    };
  }
};

// Lấy chi tiết báo cáo phân tích
export const getAnalysisDetail = async (gardenId, reportId) => {
  try {
    console.log(`Gửi request lấy chi tiết báo cáo với gardenId=${gardenId}, reportId=${reportId}`);
    
    const response = await axios.get(`/gardens/${gardenId}/analysis/${reportId}`);
    console.log('Phản hồi từ API getAnalysisDetail:', response);
    
    return response;
  } catch (error) {
    console.error('Lỗi khi gọi API lấy chi tiết báo cáo:', error);
    throw error.response?.data || { 
      success: false, 
      message: error.message || 'Lỗi khi lấy chi tiết báo cáo phân tích' 
    };
  }
};

// Áp dụng đề xuất từ báo cáo phân tích
export const applyRecommendations = async (gardenId, reportId, options = {}) => {
  try {
    const { applyImmediately = true } = options;
    console.log(`Gửi request áp dụng đề xuất với gardenId=${gardenId}, reportId=${reportId}`);
    
    const response = await axios.post(`/gardens/${gardenId}/analysis/${reportId}/apply`, {
      applyImmediately
    });
    console.log('Phản hồi từ API applyRecommendations:', response);
    
    // Kiểm tra cấu trúc dữ liệu phản hồi từ API
    if (response && response.success !== undefined) {
      // API đã trả về đúng định dạng {success, message, data}
      return response;
    } else if (response && (response.actions !== undefined || response.schedules !== undefined)) {
      // API trả về định dạng {actions, schedules} (không có success)
      // Chuyển đổi phản hồi để phù hợp với cấu trúc mong đợi
      return {
        success: true,
        message: 'Áp dụng đề xuất thành công',
        data: {
          actions: response.actions || [],
          schedules: response.schedules || []
        }
      };
    } else {
      // Trường hợp phản hồi không rõ cấu trúc
      console.warn('Phản hồi từ API không đúng định dạng mong đợi:', response);
      return {
        success: false,
        message: 'Phản hồi từ API không đúng định dạng',
        data: response || {}
      };
    }
  } catch (error) {
    console.error('Lỗi khi gọi API áp dụng đề xuất:', error);
    throw error.response?.data || { 
      success: false, 
      message: error.message || 'Lỗi khi áp dụng đề xuất' 
    };
  }
};

// Kiểm tra kết nối Gemini API
export const testGeminiConnection = async (gardenId) => {
  try {
    const response = await axios.get(`/gardens/${gardenId}/analysis/test-gemini`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi kiểm tra kết nối Gemini API' };
  }
}; 