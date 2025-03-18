import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import socketService from '../services/socketService';

// Tạo context
const AuthContext = createContext();

// API URL - Trỏ trực tiếp đến backend
const API_URL = 'http://localhost:3001/api';

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kiểm tra xem người dùng đã đăng nhập chưa
  const isAuthenticated = !!token;

  // Thiết lập axios interceptor để thêm token vào header
  useEffect(() => {
    const setupAxios = () => {
      axios.defaults.baseURL = API_URL;
      
      // Xóa tất cả interceptors cũ để tránh duplications
      axios.interceptors.request.eject(axios.interceptors.request.handlers?.[0]?.id);
      axios.interceptors.response.eject(axios.interceptors.response.handlers?.[0]?.id);

      // Thêm token vào header của mỗi request
      axios.interceptors.request.use(
        (config) => {
          console.log('Interceptor đang thêm token vào request', config.url);
          const currentToken = localStorage.getItem('token');
          if (currentToken) {
            console.log('Token được thêm vào header:', currentToken.substring(0, 20) + '...');
            config.headers.Authorization = `Bearer ${currentToken}`;
          } else {
            console.log('Không có token trong localStorage');
          }
          
          // Đảm bảo có Content-Type cho request POST
          if (config.method === 'post' || config.method === 'put') {
            config.headers['Content-Type'] = 'application/json';
          }
          return config;
        },
        (error) => {
          console.error('Lỗi trong interceptor request:', error);
          return Promise.reject(error);
        }
      );

      // Xử lý lỗi từ response
      axios.interceptors.response.use(
        (response) => {
          console.log('Interceptor nhận response thành công:', response.config.url);
          return response;
        },
        (error) => {
          console.error('Interceptor phát hiện lỗi response:', error.config?.url, error.response?.status);
          if (error.response && error.response.status === 401) {
            // Token hết hạn hoặc không hợp lệ
            console.error('Token không hợp lệ hoặc hết hạn, đang logout');
            logout();
            toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
          }
          return Promise.reject(error);
        }
      );
    };

    setupAxios();
    
    // Khởi tạo lại socket khi token thay đổi
    if (token) {
      console.log('Token thay đổi, khởi tạo lại socket');
      socketService.disconnectSocket();
      socketService.initializeSocket();
    }
  }, [token]);

  // Tải thông tin người dùng khi có token
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        console.log('Đang tải thông tin người dùng với token:', token.substring(0, 10) + '...');
        const res = await axios.get('/auth/profile');
        console.log('Phản hồi đầy đủ từ API profile:', res);
        console.log('Dữ liệu phản hồi từ API profile:', res.data);
        
        // Kiểm tra cấu trúc dữ liệu và gán đúng vào state
        if (res.data && res.data.data && res.data.data.user) {
          console.log('Tìm thấy người dùng trong res.data.data.user:', res.data.data.user);
          setUser(res.data.data.user);
        } else if (res.data && res.data.data) {
          console.log('Tìm thấy người dùng trong res.data.data:', res.data.data);
          setUser(res.data.data);
        } else if (res.data && res.data.user) {
          console.log('Tìm thấy người dùng trong res.data.user:', res.data.user);
          setUser(res.data.user);
        } else {
          console.log('Không tìm thấy dữ liệu người dùng trong cấu trúc thông thường, sử dụng res.data:', res.data);
          setUser(res.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Lỗi tải thông tin người dùng:', err);
        console.error('Chi tiết lỗi từ API:', err.response?.data);
        setError(err.response?.data?.message || 'Lỗi tải thông tin người dùng');
        setToken(null);
        localStorage.removeItem('token');
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Đăng nhập
  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('Dữ liệu đăng nhập:', { username: email, password: '***' });
      
      const res = await axios.post('/auth/login', { username: email, password });
      console.log('Phản hồi từ API đăng nhập:', res.data);
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        // Kiểm tra cả hai trường hợp cấu trúc dữ liệu
        setUser(res.data.data || res.data.user || {});
        toast.success('Đăng nhập thành công!');
        return true;
      } else if (res.data.success) {
        // Trường hợp API trả về thành công nhưng không có token trực tiếp
        if (res.data.data && res.data.data.token) {
          localStorage.setItem('token', res.data.data.token);
          setToken(res.data.data.token);
          setUser(res.data.data);
        }
        toast.success('Đăng nhập thành công!');
        return true;
      }
      // Trường hợp không thành công nhưng không có lỗi
      toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
      return false;
    } catch (err) {
      console.error('Chi tiết lỗi đăng nhập:', err.response?.data);
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký
  const register = async (userData) => {
    try {
      setLoading(true);
      console.log('Dữ liệu đăng ký gửi đi:', userData);
      
      // Sử dụng đường dẫn đúng - không thêm /api vì API_URL đã có
      const res = await axios.post('/auth/register', userData);
      
      // Kiểm tra phản hồi thành công từ API
      if (res.data && res.data.success) {
        // Nếu có token, lưu nó vào localStorage
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          setToken(res.data.token);
          setUser(res.data.data);
        }
        
        toast.success(res.data.message || 'Đăng ký thành công!');
        return true;
      } else {
        // Trường hợp API trả về thành công nhưng không có trường success
        toast.success('Đăng ký thành công!');
        return true;
      }
    } catch (err) {
      console.error('Chi tiết lỗi đăng ký:', err.response?.data);
      setError(err.response?.data?.message || 'Đăng ký thất bại');
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.info('Đã đăng xuất');
  };

  // Cập nhật thông tin người dùng
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.put('/auth/profile', userData);
      setUser(res.data.user);
      toast.success('Cập nhật thông tin thành công!');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thông tin thất bại');
      toast.error(err.response?.data?.message || 'Cập nhật thông tin thất bại');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Đổi mật khẩu
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      await axios.put('/auth/change-password', passwordData);
      toast.success('Đổi mật khẩu thành công!');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Giá trị context
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook để sử dụng context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider');
  }
  return context;
}; 