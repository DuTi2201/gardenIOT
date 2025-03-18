import axios from 'axios';

// Lấy danh sách vườn của người dùng
export const getGardens = async () => {
  try {
    console.log('Bắt đầu gọi API getGardens, token hiện tại:', localStorage.getItem('token')?.substring(0, 20) + '...');
    const response = await axios.get('/gardens');
    console.log('Phản hồi thành công từ API getGardens:', response);
    console.log('Dữ liệu phản hồi từ API getGardens:', response.data);
    
    // Kiểm tra và log cấu trúc dữ liệu
    console.log('Kiểm tra cấu trúc dữ liệu:');
    console.log('- response.data:', response.data);
    console.log('- response.data.data:', response.data?.data);
    console.log('- response.data.gardens:', response.data?.gardens);
    console.log('- response.data.data?.gardens:', response.data?.data?.gardens);
    
    // Đảm bảo cấu trúc dữ liệu trả về đúng với yêu cầu của frontend
    let result = { gardens: [] };
    
    if (response.data?.success && response.data?.data) {
      // Cấu trúc { success: true, data: [...] }
      if (Array.isArray(response.data.data)) {
        console.log('Tìm thấy cấu trúc data.data là mảng, sử dụng trực tiếp');
        result = { gardens: response.data.data };
      } 
      // Cấu trúc { success: true, data: { gardens: [...] } }
      else if (response.data.data.gardens && Array.isArray(response.data.data.gardens)) {
        console.log('Tìm thấy cấu trúc data.data.gardens, sử dụng');
        result = { gardens: response.data.data.gardens };
      }
    } 
    // Cấu trúc { gardens: [...] }
    else if (response.data?.gardens && Array.isArray(response.data.gardens)) {
      console.log('Tìm thấy cấu trúc data.gardens, sử dụng');
      result = { gardens: response.data.gardens };
    }
    // Cấu trúc [...] (mảng trực tiếp)
    else if (Array.isArray(response.data)) {
      console.log('Tìm thấy response.data là mảng, sử dụng trực tiếp');
      result = { gardens: response.data };
    }
    
    console.log('Kết quả cuối cùng:', result);
    
    // Đảm bảo mỗi garden có _id
    if (result.gardens && Array.isArray(result.gardens)) {
      result.gardens = result.gardens.map(garden => {
        // Nếu garden có id nhưng không có _id, sử dụng id làm _id
        if (garden.id && !garden._id) {
          return { ...garden, _id: garden.id };
        }
        return garden;
      });
    }
    
    return result;
  } catch (error) {
    console.error('Lỗi khi gọi API getGardens:', error);
    console.error('Status code:', error.response?.status);
    console.error('Phản hồi từ server:', error.response?.data);
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách vườn' };
  }
};

// Lấy thông tin chi tiết vườn
export const getGardenById = async (gardenId) => {
  try {
    console.log(`Bắt đầu gọi API getGardenById với ID: ${gardenId}`);
    
    if (!gardenId || gardenId === 'undefined') {
      console.error('Garden ID không hợp lệ:', gardenId);
      throw new Error('Garden ID không hợp lệ');
    }
    
    const response = await axios.get(`/gardens/${gardenId}`);
    console.log(`Phản hồi thành công từ API getGardenById (${gardenId}):`, response.data);
    
    // Đảm bảo cấu trúc dữ liệu trả về đúng
    let result = { garden: null };
    
    if (response.data && response.data.success) {
      // Cấu trúc { success: true, data: { garden: {...} } }
      if (response.data.data && response.data.data.garden) {
        console.log('Tìm thấy cấu trúc data.data.garden, sử dụng');
        result = { garden: response.data.data.garden };
      }
      // Cấu trúc { success: true, garden: {...} }
      else if (response.data.garden) {
        console.log('Tìm thấy cấu trúc data.garden, sử dụng');
        result = { garden: response.data.garden };
      }
      // Cấu trúc { success: true, data: {...} } - data là garden
      else if (response.data.data && !Array.isArray(response.data.data)) {
        console.log('Tìm thấy cấu trúc data.data là object, sử dụng làm garden');
        result = { garden: response.data.data };
      }
    } 
    // Cấu trúc { garden: {...} }
    else if (response.data && response.data.garden) {
      console.log('Tìm thấy cấu trúc data.garden, sử dụng');
      result = { garden: response.data.garden };
    }
    // Cấu trúc {...} - response.data là garden
    else if (response.data && !Array.isArray(response.data)) {
      console.log('Tìm thấy response.data là object, sử dụng trực tiếp làm garden');
      result = { garden: response.data };
    }
    
    // Kiểm tra xem garden có tồn tại không
    if (!result.garden) {
      console.error('Không tìm thấy dữ liệu garden trong phản hồi:', response.data);
      throw new Error('Không tìm thấy dữ liệu garden');
    }
    
    // Đảm bảo garden có các thuộc tính cần thiết
    if (!result.garden.name) {
      console.warn('Garden không có thuộc tính name:', result.garden);
      result.garden.name = 'Vườn không tên';
    }
    
    console.log('Kết quả cuối cùng:', result);
    return result;
  } catch (error) {
    console.error(`Lỗi khi gọi API getGardenById (${gardenId}):`, error);
    console.error('Status code:', error.response?.status);
    console.error('Phản hồi từ server:', error.response?.data);
    throw error.response?.data || { message: 'Lỗi khi lấy thông tin vườn' };
  }
};

// Kết nối vườn mới bằng mã serial
export const connectGarden = async (gardenData) => {
  try {
    const response = await axios.post('/gardens/connect', gardenData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi kết nối vườn mới' };
  }
};

// Cập nhật thông tin vườn
export const updateGarden = async (gardenId, gardenData) => {
  try {
    const response = await axios.put(`/gardens/${gardenId}`, gardenData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi cập nhật thông tin vườn' };
  }
};

// Xóa vườn
export const deleteGarden = async (gardenId) => {
  try {
    const response = await axios.delete(`/gardens/${gardenId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi xóa vườn' };
  }
};

// Cập nhật cài đặt vườn
export const updateGardenSettings = async (gardenId, settingsData) => {
  try {
    const response = await axios.put(`/gardens/${gardenId}/settings`, settingsData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi cập nhật cài đặt vườn' };
  }
};

// Lấy trạng thái kết nối vườn
export const getGardenStatus = async (gardenId) => {
  try {
    const response = await axios.get(`/gardens/${gardenId}/status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi lấy trạng thái vườn' };
  }
};

// Lấy dữ liệu cảm biến mới nhất
export const getLatestSensorData = async (gardenId) => {
  try {
    console.log(`Gọi API lấy dữ liệu cảm biến mới nhất cho vườn ${gardenId}`);
    
    // Thêm tham số timestamp để tránh cache
    const params = { _t: new Date().getTime() };
    const response = await axios.get(`/gardens/${gardenId}/data`, { params });
    
    console.log('Phản hồi từ API dữ liệu cảm biến mới nhất:', response.data);
    
    if (response.data && response.data.timestamp) {
      console.log(`Thời gian của dữ liệu cảm biến mới nhất: ${new Date(response.data.timestamp).toLocaleString()}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu cảm biến mới nhất:', error);
    throw error.response?.data || { message: 'Lỗi khi lấy dữ liệu cảm biến mới nhất' };
  }
};

// Lấy lịch sử dữ liệu cảm biến
export const getSensorDataHistory = async (gardenId, params) => {
  try {
    console.log(`Gọi API lấy lịch sử dữ liệu cảm biến cho vườn ${gardenId} với params:`, params);
    
    // Đảm bảo gardenId hợp lệ
    if (!gardenId) {
      console.error('Garden ID không hợp lệ:', gardenId);
      throw new Error('Garden ID không hợp lệ');
    }
    
    // Đảm bảo tham số duration đúng định dạng
    if (params && params.duration) {
      // Kiểm tra xem duration đã có định dạng đúng chưa (ví dụ: '24h', '7d')
      if (!params.duration.endsWith('h') && !params.duration.endsWith('d')) {
        // Nếu chưa có hậu tố, thêm 'h' cho giờ
        if (!isNaN(params.duration)) {
          params.duration = `${params.duration}h`;
        }
      }
      console.log(`Tham số duration đã xử lý: ${params.duration}`);
    }
    
    // Thêm tham số timestamp hiện tại để đảm bảo không bị cache
    const requestParams = { 
      ...params,
      _t: new Date().getTime(),
      limit: 1000 // Tăng giới hạn số lượng dữ liệu trả về
    };
    
    // Gọi API với tham số
    console.log(`Gửi yêu cầu đến API với params:`, requestParams);
    const response = await axios.get(`/gardens/${gardenId}/data/history`, { params: requestParams });
    console.log('Phản hồi từ API lịch sử dữ liệu cảm biến:', response.data);
    
    // Xử lý các cấu trúc dữ liệu khác nhau có thể trả về
    let result = [];
    
    if (response.data && response.data.success) {
      // Cấu trúc { success: true, data: [...] }
      if (Array.isArray(response.data.data)) {
        console.log('Tìm thấy cấu trúc data.data là mảng, sử dụng trực tiếp');
        result = response.data.data;
      }
    } 
    // Cấu trúc { data: [...] }
    else if (response.data && Array.isArray(response.data.data)) {
      console.log('Tìm thấy cấu trúc data.data là mảng, sử dụng trực tiếp');
      result = response.data.data;
    }
    // Cấu trúc [...] (mảng trực tiếp)
    else if (Array.isArray(response.data)) {
      console.log('Tìm thấy response.data là mảng, sử dụng trực tiếp');
      result = response.data;
    }
    
    // Kiểm tra dữ liệu
    if (result.length === 0) {
      console.warn('Không có dữ liệu cảm biến nào được trả về từ API');
    } else {
      // Sắp xếp dữ liệu theo thời gian tăng dần
      result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Log thông tin về dữ liệu
      const firstTimestamp = new Date(result[0].timestamp);
      const lastTimestamp = new Date(result[result.length - 1].timestamp);
      const timeRange = (lastTimestamp - firstTimestamp) / (1000 * 60 * 60); // Số giờ
      const now = new Date();
      const timeSinceLastData = (now - lastTimestamp) / (1000 * 60); // Số phút
      
      console.log(`Dữ liệu lịch sử cảm biến đã xử lý: ${result.length} điểm dữ liệu`);
      console.log(`Khoảng thời gian: từ ${firstTimestamp.toLocaleString()} đến ${lastTimestamp.toLocaleString()} (${timeRange.toFixed(2)} giờ)`);
      console.log(`Tần suất dữ liệu: trung bình ${(result.length / timeRange).toFixed(2)} điểm/giờ`);
      console.log(`Thời gian từ dữ liệu mới nhất đến hiện tại: ${timeSinceLastData.toFixed(2)} phút`);
      
      // Kiểm tra xem dữ liệu có cập nhật không
      if (timeSinceLastData > 60) {
        console.warn(`Cảnh báo: Dữ liệu cảm biến có vẻ không được cập nhật trong ${timeSinceLastData.toFixed(0)} phút qua!`);
      }
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử dữ liệu cảm biến:', error);
    console.error('Chi tiết lỗi:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Lỗi khi lấy lịch sử dữ liệu cảm biến' };
  }
}; 