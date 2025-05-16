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
import testRoutes from "./routes/test-routes.js";
import aiRoutes from "./routes/ai.route.js";

dotenv.config({});

const app = express();

// Enable trust proxy setting for Express to work with Kubernetes and cloud environments
app.set('trust proxy', true);

// Force set NODE_ENV to production when running on GKE
if (process.env.KUBERNETES_SERVICE_HOST) {
    console.log("Running in Kubernetes environment - forcing production mode");
    process.env.NODE_ENV = 'production';
}

// Initialize app and DB connection without session configuration first
const initApp = async () => {
    console.log(`Starting server in ${process.env.NODE_ENV || 'production'} mode`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://jobmarket.fun'}`);
    console.log(`Backend URL: ${process.env.BASE_URL || 'http://34.81.121.101'}`);

    // Configure CORS first - before ANY other middleware
const corsOptions = {
    origin: function(origin, callback) {
        console.log('CORS Request from origin:', origin || 'no origin');
        
        // Instead of allowing all origins, specify allowed domains
        const allowedOrigins = [
            'http://jobmarket.fun',
            'https://jobmarket.fun',
            'http://www.jobmarket.fun',
            'https://www.jobmarket.fun',
            // Include for local development if needed
            'http://localhost:5173'
        ];
        
        // Check if origin is in allowed list or undefined (for same-origin requests)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            console.log(`CORS allowed for origin: ${origin || 'same-origin'}`);
        } else {
            console.log(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
        credentials: true, // Quan trọng: Bắt buộc cho việc gửi/nhận cookies
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires', 'X-Requested-With'],
        exposedHeaders: ['Set-Cookie'], 
        maxAge: 86400, // 24 hours in seconds
        preflightContinue: false // Ngăn chặn OPTIONS request tiếp tục đến route handler
    };
    
    // Apply CORS to all routes BEFORE any other middleware
    app.use(cors(corsOptions));
    
    // Add explicit OPTIONS handler to respond immediately to preflight requests
    app.options('*', (req, res) => {
        console.log('Received OPTIONS request for:', req.originalUrl);
        res.status(200).end();
    });
    
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

    // Add CORS error handler AFTER applying CORS middleware
    app.use((err, req, res, next) => {
        if (err.message === 'Not allowed by CORS') {
            console.error('CORS Error:', err);
            return res.status(403).json({
                message: 'CORS not allowed from this origin',
                success: false
            });
        }
        next(err);
    });
    
    // Add test route for Google OAuth callback URL verification
    app.get('/api/v1/auth-test', (req, res) => {
        res.status(200).json({
            message: 'Auth routes are working correctly',
            callbackUrl: process.env.OAUTH_CALLBACK_URL || 'http://jobmarket.fun/api/v1/user/auth/google/callback',
            timestamp: new Date().toISOString()
        });
    });

    // Apply basic rate limiter with less restrictive settings during development
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
        app.use(basicLimiter);
    } else {
        // More permissive rate limiting during development
        app.use((req, res, next) => {
            // Check if the request is from development environment
            if (req.headers.origin === 'http://jobmarket.fun') {
                // Skip rate limiting for development requests
                return next();
            }
            // Apply rate limiting for other requests
            basicLimiter(req, res, next);
        });
    };

    // Cấu hình session với memory store
    const sessionConfig = {
        secret: process.env.SECRET_KEY || 'jobportal_default_secret_key_change_in_production',
        resave: false,
        saveUninitialized: false,
        cookie: { 
            secure: false, // Luôn sử dụng false cho HTTP
            httpOnly: true, // Prevent client-side JS from reading the cookie
            sameSite: 'lax', // Sử dụng lax để hoạt động tốt với HTTP
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            domain: process.env.COOKIE_DOMAIN || 'jobmarket.fun',
            path: '/' // Ensure cookies are sent for all paths

        },
        // Giúp tránh lỗi session khi có nhiều request cùng lúc
        rolling: true,
        name: 'jobportal.sid' // Tên cookie session rõ ràng
    };
    
    console.log('Sử dụng memory store cho sessions');

    // Configure session
    app.use(session(sessionConfig));

    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());

    
    // Health check endpoint cho Kubernetes readiness/liveness probe
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'job-portal-backend'
      });
    });

    // Root route handler to prevent 404 errors on direct IP access
    app.get('/', (req, res) => {
      res.status(200).json({
        message: 'Job Portal API is running',
        docs: '/api/v1',
        health: '/health'
      });
    });

    // api's routes
    app.use("/api/v1/user", userRoute);
    app.use("/api/v1/company", companyRoute);
    app.use("/api/v1/job", jobRoute);
    app.use("/api/v1/application", applicationRoute);
    app.use("/api/v1/test", testRoutes);
    app.use("/api/v1/ai", aiRoutes);

    // Add a catch-all route for debugging
app.get("/api/v1/*", (req, res) => {
  res.status(200).json({
    message: "API route accessed but not found",
    path: req.originalUrl,
    params: req.params,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});
    // Add a final catch-all CORS handler for any routes that might be missed
    app.use('*', (req, res, next) => {
        res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
        res.header("Access-Control-Allow-Credentials", "true");
        res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
        res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,Cache-Control,Pragma,Expires,X-Requested-With");
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        next();
    });

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

    app.listen( process.env.PORT, '0.0.0.0', () => {
        console.log(`Server is running on PORT ${process.env.PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log('Using memory store for session and cache');
    });

    // connect db
    connectDB();
};

// Start the application
initApp().catch(error => {
    console.error('Failed to initialize application:', error);
    process.exit(1);
});