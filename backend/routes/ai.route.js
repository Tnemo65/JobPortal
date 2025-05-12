import express from "express";
import { summarizeJob, 
        testJobSummary, 
        generateInterviewQuestions } from "../controllers/ai.controller.js";
import { apiLimiter } from "../middlewares/rate-limiter.js";


const router = express.Router();

// Route cho người dùng yêu cầu tóm tắt công việc
router.get("/summarize/job/:id", summarizeJob);
router.get("/test-summary", testJobSummary);

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