import express from "express";
import { summarizeJob, improveJobDescription, updateJobDescription,
        generateInterviewQuestions } from "../controllers/ai.controller.js";
import { apiLimiter } from "../middlewares/rate-limiter.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";


const router = express.Router();

// Route cho người dùng yêu cầu tóm tắt công việc
router.get("/summarize/job/:id", summarizeJob);

// Route mới: tạo câu hỏi phỏng vấn cho người tìm việc
router.get("/interview-questions/:jobId", 
  apiLimiter, 
  generateInterviewQuestions
);
// Routes mới: cải thiện mô tả công việc
router.get("/improve-description/:jobId", 
  apiLimiter,
  improveJobDescription
);

router.put("/update-description/:jobId",
  apiLimiter,
  updateJobDescription
);
export default router;