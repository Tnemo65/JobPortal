import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import checkRole from "../middlewares/checkRole.js";
import checkOwnership from "../middlewares/checkOwnership.js";
import { getCompany, getCompanyById, registerCompany, updateCompany } from "../controllers/company.controller.js";
import { singleUpload } from "../middlewares/mutler.js";
import { apiLimiter } from "../middlewares/rate-limiter.js";
import { apiCache } from "../utils/redis-cache.js";

const router = express.Router();

// Routes chỉ dành cho nhà tuyển dụng (recruiter)
router.route("/register").post(
    isAuthenticated, 
    checkRole(['recruiter']),
    apiLimiter,
    registerCompany
);

// Cập nhật công ty - kiểm tra quyền sở hữu
router.route("/update/:id").put(
    isAuthenticated, 
    checkRole(['recruiter']),
    checkOwnership('company'),
    singleUpload, 
    apiLimiter,
    updateCompany
);

// Routes có thể truy cập bởi các vai trò khác nhau - thêm cache 10 phút
router.route("/get").get(
    isAuthenticated,
    apiLimiter,
    apiCache.middleware('10 minutes'),
    getCompany
);

router.route("/get/:id").get(
    isAuthenticated,
    apiLimiter, 
    apiCache.middleware('5 minutes'),
    getCompanyById
);

export default router;

