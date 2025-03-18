import axios from 'axios';

// Lấy trạng thái các thiết bị
export const getDevicesStatus = async (gardenId) => {
  try {
    const response = await axios.get(`/gardens/${gardenId}/devices/status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi lấy trạng thái thiết bị' };
  }
};

// Điều khiển thiết bị
export const controlDevice = async (gardenId, device, state) => {
  try {
    const response = await axios.post(`/gardens/${gardenId}/devices/${device}/control`, { state });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi điều khiển thiết bị' };
  }
};

// Bật/tắt chế độ tự động
export const toggleAutoMode = async (gardenId, state) => {
  try {
    const response = await axios.post(`/gardens/${gardenId}/devices/AUTO/control`, { state });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi thay đổi chế độ tự động' };
  }
};

// Bật tất cả thiết bị
export const turnOnAllDevices = async (gardenId) => {
  try {
    const response = await axios.post(`/gardens/${gardenId}/devices/ALL/control`, { state: true });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi bật tất cả thiết bị' };
  }
};

// Tắt tất cả thiết bị
export const turnOffAllDevices = async (gardenId) => {
  try {
    const response = await axios.post(`/gardens/${gardenId}/devices/ALL/control`, { state: false });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lỗi khi tắt tất cả thiết bị' };
  }
}; 