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
      console.log('Authentication error:', error.response.data.code);
      
      // Nếu token hết hạn, thử refresh token
      const errorCode = error.response.data.code;
      if (errorCode === 'TOKEN_EXPIRED') {
        try {
          // Gọi endpoint refresh token
          await axios.post(`/api/v1/user/refresh-token`, {}, {
            withCredentials: true
          });
          
          // Nếu refresh thành công, thử lại request ban đầu
          return api(error.config);
        } catch (refreshError) {
          console.log('Token refresh failed, redirecting to login');
          // Redirect to login page
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else if (errorCode === 'INVALID_TOKEN' || errorCode === 'JWT_ERROR') {
        // Redirect đến trang login nếu token không hợp lệ
        window.location.href = '/login';
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