// Production vs Development API endpoints
const API_BASE = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? "http://jobmarket.fun/api/v1"
    : "http://localhost:8080/api/v1");

// Expose this for other imports
export { API_BASE };

export const USER_API_END_POINT = `${API_BASE}/user`;
export const JOB_API_END_POINT = `${API_BASE}/job`;
export const APPLICATION_API_END_POINT = `${API_BASE}/application`;
export const COMPANY_API_END_POINT = `${API_BASE}/company`;

// Frontend URL for redirects
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 
  (import.meta.env.PROD ? "http://35.234.9.125" : "http://localhost:5173");

// Authentication endpoints
export const GOOGLE_AUTH_URL = `${USER_API_END_POINT}/auth/google`;
export const GOOGLE_AUTH_CALLBACK_URL = `${USER_API_END_POINT}/auth/google/callback`;

// Health check endpoint
export const HEALTH_STATUS_URL = `${API_BASE}/health`;