import express from "express";
import { summarizeJob, testJobSummary } from "../controllers/ai.controller.js";
import { apiLimiter } from "../middlewares/rate-limiter.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Route cho người dùng yêu cầu tóm tắt công việc
router.get("/summarize/job/:id", summarizeJob);
router.get("/test-summary", testJobSummary);

export default router;