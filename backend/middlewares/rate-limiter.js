import rateLimit from "express-rate-limit";

// Kiểm tra môi trường
const isDevelopment = process.env.NODE_ENV !== 'production';

// Common configuration for all rate limiters
const baseConfig = {
    standardHeaders: true,
    legacyHeaders: false,
    // Add trusted proxy config to work with Kubernetes and LoadBalancers
    trustProxy: true
};

// Giới hạn cơ bản cho tất cả các routes
export const basicLimiter = rateLimit({
    ...baseConfig,
    windowMs: 15 * 60 * 1000, // 15 phút
    max: isDevelopment ? 1000 : 500, // Tăng lên 1000 cho môi trường dev, 500 cho production
    message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau.", success: false },
    // Thêm logging để debug trong môi trường development
    skip: (req) => {
        if (isDevelopment && req.headers.origin === 'http://localhost:5173') {
            return Math.random() > 0.1; // Log khoảng 10% request trong development
        }
        return false;
    }
});

// Rate limiter nghiêm ngặt hơn cho các routes liên quan đến xác thực
export const authLimiter = rateLimit({
    ...baseConfig,
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: isDevelopment ? 100 : 30, // Tăng lên 100 cho development
    message: { message: "Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 1 giờ.", success: false },
    skipSuccessfulRequests: true, // Không tính các request thành công
});

// Rate limiter dành riêng cho API
export const apiLimiter = rateLimit({
    ...baseConfig,
    windowMs: 10 * 60 * 1000, // 10 phút
    max: isDevelopment ? 500 : 250, // Tăng lên 500 cho development
    message: { message: "Đã vượt quá giới hạn API, vui lòng thử lại sau.", success: false },
    skip: (req) => {
        // Trong môi trường development, bỏ qua rate limit cho frontend localhost
        return isDevelopment && req.headers.origin === 'http://localhost:5173';
    }
});