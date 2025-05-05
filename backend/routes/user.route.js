import express from "express";
import { getSavedJobs, getSsoProfile, login, logout, register, saveJob, ssoAuthFailure, ssoAuthSuccess, unsaveJob, updateProfile, deleteResume, getNotifications, markNotificationRead, markAllNotificationsRead } from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload, multiFieldUpload } from "../middlewares/mutler.js";
import { Notification } from '../models/notification.model.js';
import passport from '../utils/passport.js';
import { authLimiter, apiLimiter } from "../middlewares/rate-limiter.js";
import strongPasswordCheck from "../middlewares/strong-password.js";
import { apiCache, redisClient } from "../utils/redis-cache.js";
import he from 'he'; // Import thư viện he để decode HTML entities
import jwt from "jsonwebtoken";

const router = express.Router();

// Regular authentication routes - với rate limiting chống brute force
router.route("/register").post(authLimiter, singleUpload, strongPasswordCheck, register);
router.route("/login").post(authLimiter, login);
router.route("/logout").get(logout);
router.route("/profile/update").post(isAuthenticated, multiFieldUpload, updateProfile);

// Middleware debug đặc biệt cho OAuth routes
const oauthDebugMiddleware = (req, res, next) => {
    // Ghi log toàn bộ thông tin request để debug
    console.log('OAuth Debug - Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('OAuth Debug - Request cookies:', req.cookies);
    console.log('OAuth Debug - Request query:', req.query);
    console.log('OAuth Debug - Request path:', req.path);
    
    // Đặt thêm thông tin vào req để sử dụng sau này
    req.oauthDebug = {
        timestamp: new Date().toISOString(),
        hasCode: Boolean(req.query.code)
    };
    
    next();
};

// Route đăng nhập Google OAuth - không sử dụng session để tránh vấn đề với cookie
router.route("/auth/google").get(
    oauthDebugMiddleware,
    (req, res, next) => {
        console.log("Starting Google auth flow");
        // Thêm state để kiểm tra CSRF
        const state = Math.random().toString(36).substring(2, 15);
        req.session.oauthState = state;
        next();
    },
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account',
        session: false // Không sử dụng session-based authentication
    })
);

// Route callback từ Google OAuth
router.route("/auth/google/callback").get(
    oauthDebugMiddleware,
    (req, res, next) => {
        console.log("Received Google auth callback with query params:", req.query);
        
        // Kiểm tra xem có code trong query params không
        if (!req.query.code) {
            console.error('No auth code received from Google');
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/sso-callback?success=false&error=${encodeURIComponent('No authentication code received from Google')}`);
        }
        
        // Decode HTML entities trong auth code
        if (req.query.code && typeof req.query.code === 'string') {
            const originalCode = req.query.code;
            req.query.code = he.decode(req.query.code);
            console.log('Decoded auth code:', originalCode.length, '->', req.query.code.length);
            
            // Kiểm tra nếu code chứa HTML entities hoặc ký tự đặc biệt
            if (originalCode.includes('&#x')) {
                console.log('Original code contains HTML entities, decoded now');
            }
            
            // Hiển thị 10 ký tự đầu tiên để kiểm tra (không hiển thị toàn bộ vì lý do bảo mật)
            console.log('First few chars of code:', originalCode.substring(0, 10) + '... -> ' + req.query.code.substring(0, 10) + '...');
        }
        
        // Chuyển tiếp xử lý cho Passport
        passport.authenticate('google', { 
            session: false,
            failureRedirect: '/api/v1/user/auth/failure'
        }, (err, user, info) => {
            if (err) {
                console.error('Google auth callback error:', err);
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/sso-callback?success=false&error=${encodeURIComponent(err.message || 'Authentication failed')}`);
            }
            
            if (!user) {
                console.error('No user returned from Google auth');
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/sso-callback?success=false&error=${encodeURIComponent('User authentication failed')}`);
            }
            
            console.log('Google auth successful for user:', user.email);
            req.user = user;
            next();
        })(req, res, next);
    },
    ssoAuthSuccess
);

router.route("/auth/failure").get(ssoAuthFailure);
router.route("/sso/profile").get(isAuthenticated, getSsoProfile);

// Notification routes
router.route("/notifications").get(isAuthenticated, getNotifications);
router.route("/notifications/:id/read").post(isAuthenticated, markNotificationRead);
router.route("/notifications/read-all").post(isAuthenticated, markAllNotificationsRead);

// Other routes - updated to support both GET and POST methods for job saving functionality
router.route("/jobs/save/:jobId")
    .get(isAuthenticated, saveJob)
    .post(isAuthenticated, saveJob);
    
router.route("/jobs/unsave/:jobId")
    .get(isAuthenticated, unsaveJob)
    .post(isAuthenticated, unsaveJob);
    
router.route("/jobs/saved").get(isAuthenticated, getSavedJobs);
router.route("/profile/resume").delete(isAuthenticated, deleteResume);

// Add refreshToken endpoint to handle token refreshing
router.route("/refresh-token").post(async (req, res) => {
    try {
        // Get refresh token from cookie
        const refreshToken = req.cookies.refresh_token;
        
        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token not provided",
                success: false,
                code: "NO_REFRESH_TOKEN"
            });
        }
        
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.SECRET_KEY);
        
        // Check if token is a refresh token
        if (!decoded || !decoded.userId || decoded.tokenType !== 'refresh') {
            return res.status(401).json({
                message: "Invalid refresh token",
                success: false,
                code: "INVALID_REFRESH_TOKEN"
            });
        }
        
        // Check if token exists in Redis
        if (redisClient && redisClient.isReady) {
            const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
            
            // Token doesn't exist in Redis or doesn't match
            if (!storedToken || storedToken !== refreshToken) {
                return res.status(401).json({
                    message: "Refresh token expired or revoked",
                    success: false,
                    code: "INVALID_REFRESH_TOKEN"
                });
            }
        }
        
        // Generate new access token
        const accessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.SECRET_KEY,
            { expiresIn: '1h' }
        );
        
        // Set the new access token in a cookie
        res.cookie("access_token", accessToken, {
            maxAge: 60 * 60 * 1000, // 1 hour
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });
        
        return res.status(200).json({
            message: "Token refreshed successfully",
            success: true
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Refresh token expired",
                success: false,
                code: "TOKEN_EXPIRED"
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: "Invalid refresh token",
                success: false,
                code: "INVALID_TOKEN"
            });
        } else {
            console.error("Refresh token error:", error);
            return res.status(500).json({
                message: "Error refreshing token",
                success: false,
                code: "SERVER_ERROR"
            });
        }
    }
});

export default router;

