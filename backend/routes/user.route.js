import express from "express";
import { getSavedJobs, getSsoProfile, login, logout, register, saveJob, ssoAuthFailure, ssoAuthSuccess, unsaveJob, updateProfile, deleteResume } from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload, multiFieldUpload } from "../middlewares/mutler.js";
import { Notification } from '../models/notification.model.js';
import passport from '../utils/passport.js';
import { authLimiter, apiLimiter } from "../middlewares/rate-limiter.js";
import strongPasswordCheck from "../middlewares/strong-password.js";
import { apiCache } from "../utils/redis-cache.js";

const router = express.Router();

// Regular authentication routes - với rate limiting chống brute force
router.route("/register").post(authLimiter, singleUpload, strongPasswordCheck, register);
router.route("/login").post(authLimiter, login);
router.route("/logout").get(logout);
router.route("/profile/update").post(isAuthenticated, multiFieldUpload, updateProfile);
router.route("/profile/delete-resume").post(isAuthenticated, deleteResume);
router.route("/jobs/save/:jobId").post(isAuthenticated, saveJob);
router.route("/jobs/unsave/:jobId").post(isAuthenticated, unsaveJob);
router.route("/jobs/saved").get(isAuthenticated, apiCache.middleware('3 minutes'), getSavedJobs);

// SSO routes
router.route('/auth/google')
    .get(authLimiter, passport.authenticate('google', { scope: ['profile', 'email'] }));

router.route('/auth/google/callback')
    .get(
        passport.authenticate('google', { 
            failureRedirect: '/auth/failure',
            session: false
        }),
        ssoAuthSuccess
    );

router.route('/auth/failure').get(ssoAuthFailure);

router.route('/sso/profile').get(isAuthenticated, getSsoProfile);

// Notifications routes - áp dụng rate limiter và cache cho API
router.route('/notifications').get(isAuthenticated, apiLimiter, apiCache.middleware('1 minute'), async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.id }).sort({ createdAt: -1 });
        res.status(200).json({ notifications, success: true });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy thông báo', success: false });
    }
});

router.route('/notifications/read-all').post(isAuthenticated, apiLimiter, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.id, read: false }, { read: true });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật thông báo', success: false });
    }
});

export default router;

