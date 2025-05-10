import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import checkRole from "../middlewares/checkRole.js";
import checkOwnership from "../middlewares/checkOwnership.js";
import { getCompany, getCompanyById, registerCompany, updateCompany } from "../controllers/company.controller.js";
import { singleUpload } from "../middlewares/mutler.js";
import { apiLimiter } from "../middlewares/rate-limiter.js";
import { apiCache } from "../utils/api-cache.js";

const router = express.Router();

// Routes chỉ dành cho admin
router.route("/register").post(
    isAuthenticated, 
    checkRole(['admin']),
    singleUpload, // Added the singleUpload middleware to handle file uploads
    apiLimiter,
    registerCompany
);

// Cập nhật công ty - kiểm tra quyền sở hữu
router.route("/update/:id").put(
    isAuthenticated, 
    checkRole(['admin']),
    checkOwnership('company'),
    singleUpload, 
    apiLimiter,
    updateCompany
);

// Get công ty của user hiện tại - support both /get and root path for backwards compatibility
router.route("/").get(
    isAuthenticated,
    checkRole(['admin']),
    apiLimiter,
    apiCache.middleware('1 minute'),
    getCompany
);

router.route("/get").get(
    isAuthenticated,
    checkRole(['admin']),
    apiLimiter,
    apiCache.middleware('1 minute'),
    getCompany
);

// Get công ty theo ID - support both /get/:id and /:id for backwards compatibility
router.route("/:id").get(
    isAuthenticated,
    apiLimiter,
    apiCache.middleware('1 minute'),
    getCompanyById
);

router.route("/get/:id").get(
    isAuthenticated,
    apiLimiter,
    apiCache.middleware('1 minute'),
    getCompanyById
);

export default router;

