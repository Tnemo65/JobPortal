import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import checkRole from "../middlewares/checkRole.js";
import { applyJob, getApplicants, getAppliedJobs, updateStatus } from "../controllers/application.controller.js";
import { apiLimiter } from "../middlewares/rate-limiter.js";
import { apiCache } from "../utils/redis-cache.js";
 
const router = express.Router();

// Route cho ứng viên (student) apply job
router.route("/apply/:id").get(
    isAuthenticated, 
    checkRole(['student']), 
    apiLimiter,
    applyJob
);

// Route cho ứng viên xem các job đã apply - giảm cache xuống 30 giây để cập nhật nhanh hơn
router.route("/get").get(
    isAuthenticated,
    apiLimiter,
    apiCache.middleware('30 seconds'),
    getAppliedJobs
);

// Route cho nhà tuyển dụng xem ứng viên của một job - thêm cache 2 phút
router.route("/:id/applicants").get(
    isAuthenticated, 
    checkRole(['recruiter']), 
    apiLimiter,
    apiCache.middleware('2 minutes'),
    getApplicants
);

// Route cho nhà tuyển dụng cập nhật trạng thái ứng tuyển
router.route("/status/:id/update").post(
    isAuthenticated, 
    checkRole(['recruiter']), 
    apiLimiter,
    updateStatus
);
 
export default router;

