import axios from 'axios';
import { API_BASE } from './constant';

// Tạo instance axios với cấu hình cơ bản
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Quan trọng: Cho phép gửi cookie qua CORS
  headers: {
    'Content-Type': 'application/json',
  }
});

// Thêm interceptor request để xử lý trước khi gửi request
api.interceptors.request.use(
  (config) => {
    // Thêm token vào header nếu có trong localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Thêm cache control header nếu cần
    if (config.bypassCache) {
      config.headers = {
        ...config.headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      };
      delete config.bypassCache; // Xóa flag để tránh gửi đi như query param
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Thêm interceptor response để xử lý response và lỗi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Xử lý lỗi authentication (401)
    if (error.response && error.response.status === 401) {
      console.log('Authentication error:', error.response?.data?.message || 'Session expired');
      
      // Nếu lỗi TOKEN_EXPIRED hoặc INVALID_TOKEN, redirect về trang login
      const errorCode = error.response.data.code;
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
        // Xóa token và thông tin user ở local storage nếu có
        localStorage.removeItem('user');
        // Redirect đến trang login nếu cần
        // window.location.href = '/login';
      }
    }
    
    // Xử lý lỗi network (không kết nối đến server)
    if (!error.response) {
      console.log('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Các hàm helper

// GET request
export const get = async (url, options = {}) => {
  return api.get(url, options);
};

// POST request
export const post = async (url, data = {}, options = {}) => {
  return api.post(url, data, options);
};

// PUT request
export const put = async (url, data = {}, options = {}) => {
  return api.put(url, data, options);
};

// DELETE request
export const del = async (url, options = {}) => {
  return api.delete(url, options);
};

// Export cả instance và các helper functions
export default api;