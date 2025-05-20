import express from "express";
import { getSavedJobs, getSsoProfile, login, logout, register, saveJob, ssoAuthFailure, ssoAuthSuccess, unsaveJob, updateProfile, deleteResume, getNotifications, markNotificationRead, markAllNotificationsRead } from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload, multiFieldUpload } from "../middlewares/mutler.js";
import { Notification } from '../models/notification.model.js';
import passport from '../utils/passport.js';
import { authLimiter, apiLimiter } from "../middlewares/rate-limiter.js";
import strongPasswordCheck from "../middlewares/strong-password.js";
import { apiCache } from "../utils/api-cache.js";
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
    console.log('OAuth Debug - Request origin:', req.headers.origin || 'No origin');
    console.log('OAuth Debug - Request referer:', req.headers.referer || 'No referer');
    
    // Đặt thêm thông tin vào req để sử dụng sau này
    req.oauthDebug = {
        timestamp: new Date().toISOString(),
        hasCode: Boolean(req.query.code)
    };
    
    next();
};

// Test route for OAuth configuration
router.route("/auth/test").get((req, res) => {
    const callbackUrl = 'https://jobmarket.fun/api/v1/user/auth/google/callback';
    const frontendUrl = process.env.FRONTEND_URL || 'https://jobmarket.fun';
    const googleClientId = process.env.GOOGLE_CLIENT_ID ? "Configured" : "Not configured";
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ? "Configured" : "Not configured";
    
    return res.status(200).json({
        message: "OAuth configuration test",
        callbackUrl,
        frontendUrl,
        googleClientId,
        googleClientSecret,
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
        protocol: req.protocol,
        secure: req.secure,
        httpsEnabled: true, // Đã chuyển sang HTTPS
        forwardedProto: req.headers['x-forwarded-proto'] || 'none'
    });
});

// Route đăng nhập Google OAuth - không sử dụng session để tránh vấn đề với cookie
router.route("/auth/google").get(
    oauthDebugMiddleware,
    (req, res, next) => {
        console.log("Starting Google auth flow");
        try {
            // Tạo và lưu state parameter để ngăn CSRF attacks
            const state = Math.random().toString(36).substring(2, 15);
            
            // Lưu state vào session hoặc cookie nếu có thể
            if (req.session) {
                req.session.oauthState = state;
                console.log("Saved OAuth state to session:", state);
            } else {
                // Fallback to cookie if session is not available
                res.cookie("oauth_state", state, { 
                    maxAge: 10 * 60 * 1000, // 10 minutes
                    httpOnly: true, 
                    secure: true, // HTTPS enabled
                    sameSite: 'lax',
                    domain: process.env.COOKIE_DOMAIN || 'jobmarket.fun'
                });
                console.log("Saved OAuth state to cookie:", state);
            }
            
            next();
        } catch (error) {
            console.error("Error setting up Google auth:", error);
            res.status(500).send("Error starting authentication process");
        }
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
        
        // Lấy frontend URL từ environment
        const frontendURL = process.env.FRONTEND_URL || 'https://jobmarket.fun';
        
        try {
            // Kiểm tra state nếu có để ngăn CSRF attacks
            const savedState = req.session?.oauthState || req.cookies?.oauth_state;
            const receivedState = req.query.state;
            
            if (savedState && receivedState && savedState !== receivedState) {
                console.error('State mismatch in OAuth callback. Possible CSRF attempt.');
                return res.redirect(`${frontendURL}/sso-callback?success=false&error=${encodeURIComponent('Security verification failed')}`);
            }
            
            // Kiểm tra xem có code trong query params không
            if (!req.query.code) {
                console.error('No auth code received from Google');
                return res.redirect(`${frontendURL}/sso-callback?success=false&error=${encodeURIComponent('No authentication code received from Google')}`);
            }
            
            // Xóa state sau khi kiểm tra
            if (req.session?.oauthState) {
                delete req.session.oauthState;
            }
            if (req.cookies?.oauth_state) {
                res.clearCookie('oauth_state');
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
                    return res.redirect(`${frontendURL}/sso-callback?success=false&error=${encodeURIComponent(err.message || 'Authentication failed')}`);
                }
                
                if (!user) {
                    console.error('No user returned from Google auth');
                    return res.redirect(`${frontendURL}/sso-callback?success=false&error=${encodeURIComponent('User authentication failed')}`);
                }
                
                console.log('Google auth successful for user:', user.email);
                req.user = user;
                next();
            })(req, res, next);
            
        } catch (error) {
            console.error('Unhandled error in auth callback:', error);
            return res.redirect(`${frontendURL}/sso-callback?success=false&error=${encodeURIComponent('An unexpected error occurred')}`);
        }
    },
    ssoAuthSuccess
);

router.route("/auth/failure").get(ssoAuthFailure);
router.route("/sso/profile").get(isAuthenticated, getSsoProfile);

// Thêm route mới để kiểm tra trạng thái SSO
router.route("/auth/status").get((req, res) => {
    return res.status(200).json({
        message: "SSO status check",
        configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        callbackUrl: 'https://jobmarket.fun/api/v1/user/auth/google/callback',
        frontendUrl: process.env.FRONTEND_URL || 'https://jobmarket.fun',
        ssoEnabled: true,
        protocol: req.protocol,
        secure: req.secure,
        httpsEnabled: true,
        timestamp: new Date().toISOString()
    });
});

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
        console.log("Refresh token request received");
        
        // Get refresh token from cookie only
        const refreshToken = req.cookies.refresh_token;
        
        if (!refreshToken) {
            console.log("No refresh token in cookies");
            return res.status(401).json({
                message: "Refresh token not provided",
                success: false,
                code: "NO_REFRESH_TOKEN", 
                forceLogin: false
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
        
        // Generate new access token
        const accessToken = await jwt.sign(
            { userId: decoded.userId }, 
            process.env.SECRET_KEY, 
            { expiresIn: '1h' }
        );
        
        // Set the new access token as an HTTP-only cookie
        const cookieOptions = {
            httpOnly: true,
            secure: false, // Must be false for HTTP
            sameSite: 'lax',
            path: '/',
            domain: process.env.COOKIE_DOMAIN || 'jobmarket.fun',
            maxAge: 60 * 60 * 1000 // 1 hour
        };
        
        res.cookie("access_token", accessToken, cookieOptions);
        // No token in response body - only cookies
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

