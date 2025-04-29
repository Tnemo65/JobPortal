import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import responseTime from "response-time";
import apicache from "apicache";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import passport from './utils/passport.js';
import session from 'express-session';
import { basicLimiter } from "./middlewares/rate-limiter.js";
import sanitizeMiddleware from "./utils/sanitizer.js";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import { redisClient } from "./utils/redis-cache.js";

dotenv.config({});

const app = express();

// Khởi tạo cache middleware
let cache = apicache.middleware;

// Security middleware
// Helmet giúp bảo mật ứng dụng bằng cách thiết lập các HTTP headers
app.use(helmet());

// Thiết lập các security headers tùy chỉnh
app.use((req, res, next) => {
    // Ngăn chặn clickjacking attacks
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Ngăn chặn MIME-sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Bật XSS Protection trên trình duyệt cũ
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Strict Transport Security - yêu cầu HTTPS
    if (process.env.NODE_ENV === 'production') {
        res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }
    
    // Content Security Policy - kiểm soát tài nguyên được phép tải
    const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://res.cloudinary.com",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'"
    ].join('; ');
    res.setHeader('Content-Security-Policy', cspDirectives);
    
    next();
});

// middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Nén dữ liệu để giảm kích thước phản hồi
app.use(compression());

// Theo dõi thời gian phản hồi
app.use(responseTime());

// Middleware sanitize tất cả dữ liệu đầu vào (body, query, params)
app.use(sanitizeMiddleware);

// Apply basic rate limiter to all routes
app.use(basicLimiter);

const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL || 'http://localhost:5173' 
        : 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));

// Configure session before initializing passport
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Secure in production
        httpOnly: true, // Prevent client-side JS from reading the cookie
        sameSite: 'strict', // CSRF protection
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 3000;

// api's
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);

// Error handler middleware - xử lý lỗi tập trung
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Đã xảy ra lỗi máy chủ nội bộ";
    
    return res.status(statusCode).json({
        message,
        success: false,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

app.listen(PORT, () => {
    console.log(`server is working on http://localhost:${PORT}`);
})

// connect db
connectDB();