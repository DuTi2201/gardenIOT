import axios from 'axios';

// Tạo một instance của axios với cấu hình cơ bản
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor cho request để thêm token xác thực
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor cho response để xử lý lỗi
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Lỗi phản hồi từ server (status code ngoài khoảng 2xx)
      if (error.response.status === 401) {
        // Lỗi xác thực - Token hết hạn hoặc không hợp lệ
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Chuyển hướng đến trang đăng nhập nếu không phải đang ở trang đăng nhập
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api; 