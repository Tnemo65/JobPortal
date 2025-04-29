import rateLimit from "express-rate-limit";

// Giới hạn cơ bản cho tất cả các routes
export const basicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 500, // Tăng từ 200 lên 500 request trong 15 phút
    standardHeaders: true, // Trả về thông tin rate limit trong headers
    legacyHeaders: false, // Disable legacy headers
    message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau.", success: false },
});

// Rate limiter nghiêm ngặt hơn cho các routes liên quan đến xác thực
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 30, // Tăng từ 10 lên 30 request đăng nhập trong 1 giờ
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 1 giờ.", success: false },
    skipSuccessfulRequests: true, // Không tính các request thành công
});

// Rate limiter dành riêng cho API
export const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 phút
    max: 250, // Tăng từ 100 lên 250 request trong 10 phút
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Đã vượt quá giới hạn API, vui lòng thử lại sau.", success: false },
});