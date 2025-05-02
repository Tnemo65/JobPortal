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
import { redisClient } from "./utils/redis-cache.js";

// Import RedisStore từ connect-redis đúng cách
import { createClient } from "redis";
import { RedisStore } from "connect-redis";

dotenv.config({});

const app = express();

// Khởi tạo cache middleware
let cache = apicache.middleware;

// Security middleware
// Helmet giúp bảo mật ứng dụng bằng cách thiết lập các HTTP headers
app.use(helmet({
    // Tắt CSP cho route OAuth callback để tránh lỗi
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.googleusercontent.com"],
            connectSrc: ["'self'", "https://*.googleapis.com"],
            frameSrc: ["'self'", "https://accounts.google.com"],
            formAction: ["'self'", "https://accounts.google.com"],
            frameAncestors: ["'none'"],
            fontSrc: ["'self'", "data:"],
        },
    },
}));

// middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb'
}));
app.use(cookieParser());

// Nén dữ liệu để giảm kích thước phản hồi
app.use(compression());

// Theo dõi thời gian phản hồi
app.use(responseTime());

// Chỉ áp dụng sanitize middleware cho các route không phải OAuth
app.use((req, res, next) => {
    // Bỏ qua sanitize cho OAuth routes
    if (req.path.includes('/auth/google') || req.path.includes('/callback')) {
        return next();
    }
    sanitizeMiddleware(req, res, next);
});

// CORS configuration - Apply before routes and after other middleware
// Apply CORS first to ensure CORS headers are sent in error responses as well
const corsOptions = {
    origin: ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'expires']
};
app.use(cors(corsOptions));

// Apply basic rate limiter with less restrictive settings during development
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
    app.use(basicLimiter);
} else {
    // More permissive rate limiting during development
    app.use((req, res, next) => {
        // Check if the request is from development environment
        if (req.headers.origin === 'http://localhost:5173') {
            // Skip rate limiting for development requests
            return next();
        }
        // Apply rate limiting for other requests
        basicLimiter(req, res, next);
    });
};

// Cấu hình session với fallback khi không có Redis
const sessionConfig = {
    secret: process.env.SECRET_KEY || 'jobportal_default_secret_key_change_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Secure in production
        httpOnly: true, // Prevent client-side JS from reading the cookie
        sameSite: 'lax', // Đổi từ strict sang lax để cho phép chuyển hướng OAuth
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
};

// Kiểm tra Redis client trước khi sử dụng
if (redisClient && process.env.USE_REDIS_SESSIONS === 'true') {
    try {
        console.log('Attempting to use Redis for session storage');
        
        // Chỉ kết nối nếu client chưa sẵn sàng và chưa được kết nối
        if (!redisClient.isReady && !redisClient.isOpen) {
            console.log('Redis client not ready, attempting to connect...');
            // Thử kết nối nếu chưa sẵn sàng
            redisClient.connect().catch(err => {
                console.error('Failed to connect to Redis:', err);
            });
        } else {
            console.log('Redis client already connected or ready');
        }
        
        // Kiểm tra nếu Redis đã sẵn sàng thì mới sử dụng RedisStore
        if (redisClient.isReady) {
            sessionConfig.store = new RedisStore({ client: redisClient });
            console.log('Using Redis session store');
        } else {
            console.warn('Redis not ready, using memory session store instead');
        }
    } catch (error) {
        console.error('Error initializing Redis store:', error);
        console.warn('Using memory session store as fallback');
    }
} else {
    console.log('Redis not configured or disabled, using memory session store');
}

// Configure session
app.use(session(sessionConfig));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 8080;

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on PORT ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

// connect db
connectDB();