import axios from '../utils/api';

// Lấy danh sách lịch trình
export const getSchedules = async (gardenId) => {
  try {
    console.log(`Gửi request lấy danh sách lịch trình với gardenId=${gardenId}`);
    
    const response = await axios.get(`/gardens/${gardenId}/schedules`);
    console.log('Phản hồi gốc từ API getSchedules:', response);
    
    return response;
  } catch (error) {
    console.error('Lỗi khi gọi API lấy danh sách lịch trình:', error);
    console.error('Chi tiết lỗi:', error.response?.data);
    throw error.response?.data || { message: 'Lỗi khi lấy danh sách lịch trình' };
  }
};

// Tạo lịch trình mới
export const createSchedule = async (gardenId, scheduleData) => {
  try {
    const response = await axios.post(`/gardens/${gardenId}/schedules`, scheduleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tạo lịch trình mới' };
  }
};

// Cập nhật lịch trình
export const updateSchedule = async (gardenId, scheduleId, scheduleData) => {
  try {
    const response = await axios.put(`/gardens/${gardenId}/schedules/${scheduleId}`, scheduleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi cập nhật lịch trình' };
  }
};

// Xóa lịch trình
export const deleteSchedule = async (gardenId, scheduleId) => {
  try {
    const response = await axios.delete(`/gardens/${gardenId}/schedules/${scheduleId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi xóa lịch trình' };
  }
};

// Bật/tắt lịch trình
export const toggleSchedule = async (gardenId, scheduleId, active) => {
  try {
    const response = await axios.put(`/gardens/${gardenId}/schedules/${scheduleId}`, { active });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi thay đổi trạng thái lịch trình' };
  }
}; 