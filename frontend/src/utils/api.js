import axios from 'axios';
import { API_BASE } from './constant';

// Hold pending refresh token requests to prevent duplication
let isRefreshingToken = false;
let refreshSubscribers = [];

// Function to add callbacks to the queue that will be processed after token refresh
const subscribeToTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Function to execute all callbacks once token is refreshed
const onTokenRefreshed = (error = null) => {
  refreshSubscribers.forEach(callback => callback(error));
  refreshSubscribers = [];
};

// Create axios instance with basic configuration for HTTP-only cookie auth
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  }
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Add cache control header if needed
    if (config.bypassCache) {
      config.headers = {
        ...config.headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      };
      delete config.bypassCache; // Remove flag to avoid sending as query param
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for handling 401s and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loops - don't retry already retried requests or refresh-token requests
    const isRefreshTokenRequest = originalRequest.url.includes('/refresh-token');
    
    // Handle 401 Unauthorized errors with cookie-based token refresh
    if (error.response && error.response.status === 401 && !isRefreshTokenRequest && !originalRequest._retry) {
      console.log('Authentication error:', error.response?.data?.code || 'UNKNOWN');
      
      if (isRefreshingToken) {
        // If a refresh is already in progress, wait for it to complete
        console.log('Token refresh already in progress, queuing request');
        return new Promise((resolve, reject) => {
          subscribeToTokenRefresh((refreshError) => {
            if (refreshError) {
              return reject(refreshError);
            }
            // Retry original request after refresh
            originalRequest._retry = true;
            // Add cache busting headers
            originalRequest.headers = {
              ...originalRequest.headers,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            };
            resolve(api(originalRequest));
          });
        });
      }
      
      // Start a refresh token process
      isRefreshingToken = true;
      originalRequest._retry = true;
      
      try {
        console.log('Attempting to refresh token using HTTP-only cookies...');
        // Add small delay to avoid race conditions
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        // Call refresh token endpoint - uses the HttpOnly refresh_token cookie
        const refreshResponse = await axios.post(`${API_BASE}/user/refresh-token`, {}, {
          withCredentials: true, // Essential for sending HTTP-only cookies
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log('Token refresh successful, retrying original request');
        
        // Reset refresh state and notify subscribers
        isRefreshingToken = false;
        onTokenRefreshed();
        
        // Retry the original request with new cookie-based token
        return api({
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError);
        
        // Check for specific error codes that require user to login again
        if (refreshError.response?.data?.code === 'TOKEN_EXPIRED' || 
            refreshError.response?.data?.code === 'NO_REFRESH_TOKEN' ||
            refreshError.response?.data?.code === 'INVALID_REFRESH_TOKEN') {
          console.log('Authentication session expired - user needs to login again');
          // Could dispatch an action to clear user state here or redirect to login
        }
        
        // Reset the refresh token state and notify subscribers about the error
        isRefreshingToken = false;
        onTokenRefreshed(refreshError);
        
        // Let components handle auth failures
        return Promise.reject(refreshError);
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.log('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions

// GET request with throttling protection
export const get = async (url, options = {}) => {
  if (options.throttle && !options.critical) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
  }
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

export default api;