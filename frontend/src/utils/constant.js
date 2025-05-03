// Production vs Development API endpoints
const API_BASE = import.meta.env.PROD 
  ? "http://34.81.121.101/api/v1"  // Backend load balancer URL
  : "http://localhost:8080/api/v1";

export const USER_API_END_POINT = `${API_BASE}/user`;
export const JOB_API_END_POINT = `${API_BASE}/job`;
export const APPLICATION_API_END_POINT = `${API_BASE}/application`;
export const COMPANY_API_END_POINT = `${API_BASE}/company`;

// Authentication endpoints
export const GOOGLE_AUTH_URL = `${USER_API_END_POINT}/auth/google`;
export const GOOGLE_AUTH_CALLBACK_URL = `${USER_API_END_POINT}/auth/google/callback`;

// Redis status endpoint (for health checking)
export const REDIS_STATUS_URL = `${API_BASE}/health`;