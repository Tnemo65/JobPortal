import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import checkRole from "../middlewares/checkRole.js";
import checkOwnership from "../middlewares/checkOwnership.js";
import { getAdminJobs, getAllJobs, getJobById, postJob } from "../controllers/job.controller.js";
import { apiLimiter } from "../middlewares/rate-limiter.js";
import { apiCache } from "../utils/redis-cache.js";

const router = express.Router();

// Public routes - có thể truy cập mà không cần đăng nhập nhưng vẫn áp dụng rate limiter
// Thêm caching 5 phút cho route lấy tất cả công việc
router.route("/get").get(apiLimiter, apiCache.middleware('5 minutes'), getAllJobs);
router.route("/get/:id").get(apiLimiter, apiCache.middleware('2 minutes'), getJobById);

// Protected routes - chỉ người dùng đã đăng nhập và là nhà tuyển dụng mới truy cập được
router.route("/post").post(
    isAuthenticated, 
    checkRole(['recruiter']), 
    apiLimiter,
    postJob
);

// Route xem tất cả tin tuyển dụng của nhà tuyển dụng
router.route("/getadminjobs").get(
    isAuthenticated, 
    checkRole(['recruiter']), 
    apiLimiter,
    apiCache.middleware('2 minutes'),
    getAdminJobs
);

// Thêm các routes khác (sẽ triển khai sau)

// Route cập nhật tin tuyển dụng, kiểm tra quyền chủ sở hữu
router.route("/update/:id").put(
    isAuthenticated, 
    checkRole(['recruiter']), 
    checkOwnership('job'),
    apiLimiter,
    (req, res) => {
        // Controller updateJob sẽ được triển khai sau
        res.status(501).json({
            message: "Tính năng đang được phát triển",
            success: false
        });
    }
);

// Route xóa tin tuyển dụng, kiểm tra quyền chủ sở hữu
router.route("/delete/:id").delete(
    isAuthenticated, 
    checkRole(['recruiter']), 
    checkOwnership('job'),
    apiLimiter,
    (req, res) => {
        // Controller deleteJob sẽ được triển khai sau
        res.status(501).json({
            message: "Tính năng đang được phát triển",
            success: false
        });
    }
);

export default router;

