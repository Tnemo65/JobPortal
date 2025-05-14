import rateLimit from "express-rate-limit";

// Kiểm tra môi trường
const isDevelopment = process.env.NODE_ENV !== 'production';

// Giới hạn cơ bản cho tất cả các routes
export const basicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: isDevelopment ? 1000 : 500, // Tăng lên 1000 cho môi trường dev, 500 cho production
    standardHeaders: true, // Trả về thông tin rate limit trong headers
    legacyHeaders: false, // Disable legacy headers
    validate: false,
    trustProxy: true, // Enable trust proxy for cloud environments behind load balancers

    message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau.", success: false },
    // Thêm logging để debug trong môi trường development
    skip: (req) => {
        if (isDevelopment && req.headers.origin === 'https://localhost:5173') {
            return Math.random() > 0.1; // Log khoảng 10% request trong development
        }
        return false;
    }
});

// Rate limiter nghiêm ngặt hơn cho các routes liên quan đến xác thực
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: isDevelopment ? 100 : 30, // Tăng lên 100 cho development
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 1 giờ.", success: false },
    skipSuccessfulRequests: true, // Không tính các request thành công
    validate: false,
    trustProxy: true, // Enable trust proxy for cloud environments behind load balancers

});

// Rate limiter dành riêng cho API
export const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 phút
    max: isDevelopment ? 500 : 250, // Tăng lên 500 cho development
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Đã vượt quá giới hạn API, vui lòng thử lại sau.", success: false },
    skip: (req) => {
        // Trong môi trường development, bỏ qua rate limit cho frontend localhost
        return isDevelopment && req.headers.origin === 'https://localhost:5173';
    },
    validate: false,
    trustProxy: true, // Enable trust proxy for cloud environments behind load balancers

});