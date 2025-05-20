import { OpenAI } from "openai";
import { Job } from "../models/job.model.js";
import { apiCache } from "../utils/api-cache.js";

// Khởi tạo client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tóm tắt một công việc cụ thể
export const summarizeJob = async (req, res) => {
  try {
    // Kiểm tra nếu tính năng AI đã bị vô hiệu hóa
    if (!req.app.locals.aiEnabled) {
      return res.status(503).json({
        success: false,
        message: "Tính năng AI đang tạm thời không khả dụng. Vui lòng thử lại sau."
      });
    }
    
    const { id } = req.params;
    
    // Kiểm tra cache trước
    const cacheKey = `summary_${id}`;
    const cachedSummary = apiCache.get(cacheKey);
    if (cachedSummary) {
      return res.status(200).json({
        success: true,
        summary: cachedSummary
      });
    }
    
    // Lấy thông tin công việc
    const job = await Job.findById(id).populate({
      path: "company",
      select: "name industry location"
    });
        // Thêm log chi tiết
    console.log("Job ID:", id);
    console.log("Found job:", job ? "Yes" : "No");
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc"
      });
    }
    
    // Tạo prompt cho AI
const prompt = `
  Tóm tắt ngắn gọn thông tin công việc sau đây trong khoảng 100-150 từ.
  Tập trung vào các kỹ năng quan trọng, trách nhiệm chính và yêu cầu kinh nghiệm.
  
  Tiêu đề: ${job.title}
  Công ty: ${job.company.name}
  Địa điểm: ${job.location}
  Loại công việc: ${job.jobType}
  Mức kinh nghiệm: ${job.experienceLevel}
  Mô tả: ${job.description}
  Yêu cầu: ${Array.isArray(job.requirements) ? job.requirements.join(". ") : job.requirements}
  
  Định dạng tóm tắt phải đúng như sau (không sử dụng markdown với dấu **):

  Tóm tắt công việc

  [Tên công việc]

  - Công ty: [Tên công ty]
  - Địa điểm: [Địa điểm]
  - Loại công việc: [Loại công việc]
  - Mức kinh nghiệm: [Mức kinh nghiệm]

  Kỹ năng quan trọng:
  1. [Kỹ năng 1]
  2. [Kỹ năng 2]

  Trách nhiệm chính:
  1. [Trách nhiệm 1]
  2. [Trách nhiệm 2]
  3. [Trách nhiệm 3]

  Yêu cầu kinh nghiệm:
  1. [Yêu cầu 1]
  2. [Yêu cầu 2]
`;
    
    // Gọi API OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "Bạn là trợ lý AI chuyên về tóm tắt thông tin tuyển dụng việc làm một cách ngắn gọn, chuyên nghiệp và đầy đủ thông tin quan trọng." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    });
    
    const summary = response.choices[0].message.content;
    
    // Lưu cache để tái sử dụng (1 ngày)
    apiCache.set(cacheKey, summary, 86400);
    
    return res.status(200).json({
      success: true,
      summary
    });
    
  } catch (error) {
    console.error("AI summarize job error:", error);
    
    let errorMessage = "Không thể tóm tắt thông tin công việc. Vui lòng thử lại sau.";
    
    if (error.status === 401) {
      // Lỗi xác thực API
      errorMessage = "Lỗi xác thực API. Vui lòng liên hệ quản trị viên.";
      // Vô hiệu hóa AI tạm thời
      if (req.app && req.app.locals) {
        req.app.locals.aiEnabled = false;
      }
    } else if (error.status === 429) {
      errorMessage = "Đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau ít phút.";
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// Tự động tạo tóm tắt khi công việc được tạo
export const generateJobSummary = async (jobId) => {
  try {
    // Kiểm tra nếu AI không khả dụng, trả về null
    if (!global.app || !global.app.locals || !global.app.locals.aiEnabled) {
      console.log("Tính năng AI đang bị vô hiệu hóa - bỏ qua tạo tóm tắt tự động");
      return null;
    }
    
    const job = await Job.findById(jobId).populate({
      path: "company",
      select: "name industry location"
    });
    
    if (!job) return null;
    
const prompt = `
  Tóm tắt ngắn gọn thông tin công việc sau đây trong khoảng 100 từ.
  Tập trung vào các kỹ năng quan trọng, trách nhiệm chính và yêu cầu kinh nghiệm.
  
  Tiêu đề: ${job.title}
  Công ty: ${job.company.name}
  Địa điểm: ${job.location}
  Loại công việc: ${job.jobType}
  Mức kinh nghiệm: ${job.experienceLevel}
  Mô tả: ${job.description}
  Yêu cầu: ${Array.isArray(job.requirements) ? job.requirements.join(". ") : job.requirements}
  
  Định dạng tóm tắt phải đúng như sau (không sử dụng markdown với dấu **):

  Tóm tắt công việc

  [Tên công việc]

  - Công ty: [Tên công ty]
  - Địa điểm: [Địa điểm]
  - Loại công việc: [Loại công việc]
  - Mức kinh nghiệm: [Mức kinh nghiệm]

  Kỹ năng quan trọng:
  1. [Kỹ năng 1]
  2. [Kỹ năng 2]

  Trách nhiệm chính:
  1. [Trách nhiệm 1]
  2. [Trách nhiệm 2]
  3. [Trách nhiệm 3]

  Yêu cầu kinh nghiệm:
  1. [Yêu cầu 1]
  2. [Yêu cầu 2]
`;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "Bạn là trợ lý AI chuyên về tóm tắt thông tin tuyển dụng việc làm một cách ngắn gọn, chuyên nghiệp và đầy đủ thông tin quan trọng." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.5,
      max_tokens: 200
    });
    
    const summary = response.choices[0].message.content;
    
    // Cập nhật trường summary trong model Job
    await Job.findByIdAndUpdate(jobId, { summary });
    
    // Cache kết quả
    apiCache.set(`summary_${jobId}`, summary, 86400);
    
    return summary;

  } catch (error) {
    console.error("Auto generate job summary error:", error);
    // Trả về null thay vì res.status(500)... vì đây không phải là hàm xử lý request
    return null;
  }
};


/**
 * Tạo câu hỏi phỏng vấn tự động dựa trên thông tin công việc
 * GET /api/v1/ai/interview-questions/:jobId
 */
export const generateInterviewQuestions = async (req, res) => {
  try {
    // Kiểm tra nếu tính năng AI đã bị vô hiệu hóa
    if (!req.app.locals.aiEnabled) {
      return res.status(503).json({
        success: false,
        message: "Tính năng AI đang tạm thời không khả dụng. Vui lòng thử lại sau."
      });
    }
    
    const { jobId } = req.params;
        console.log("Generating interview questions for job:", jobId);

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "ID công việc là bắt buộc"
      });
    }
    
    // Kiểm tra cache trước
    const cacheKey = `interview_questions_${jobId}`;
    const cachedQuestions = apiCache.get(cacheKey);
    if (cachedQuestions) {
      console.log("Returning cached interview questions");
      return res.status(200).json({
        success: true,
        jobTitle: "Cached Job", // Sẽ được ghi đè bởi frontend
        questions: cachedQuestions
      });
    }
    
    // Lấy thông tin công việc từ database với error handling chi tiết
    let job;
    try {
      job = await Job.findById(jobId).populate({
        path: "company",
        select: "name industry"
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi truy vấn cơ sở dữ liệu",
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
    
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc"
      });
    }
    
    // Tạo prompt cho OpenAI
const prompt = `
  Tạo bộ câu hỏi phỏng vấn cho vị trí sau:
  
  Tiêu đề: ${job.title}
  Công ty: ${job.company?.name || ""}
  Ngành: ${job.company?.industry || ""}
  Mô tả công việc: ${job.description}
  Yêu cầu: ${Array.isArray(job.requirements) ? job.requirements.join(". ") : job.requirements}
  Mức kinh nghiệm: ${job.experienceLevel}
  
  Tạo 10 câu hỏi phỏng vấn được chia thành 3 loại:
  
  1. Câu hỏi kỹ thuật/kỹ năng chuyên môn (4 câu)
  2. Câu hỏi về kinh nghiệm làm việc (3 câu)
  3. Câu hỏi về tính cách và phù hợp văn hóa (3 câu)
  
  Mỗi câu hỏi phải theo cấu trúc chính xác sau:
  
  I. CÂU HỎI KỸ THUẬT/CHUYÊN MÔN:
  Câu 1: [câu hỏi]
  Mục đích: [mục đích của câu hỏi]
  Gợi ý: [gợi ý trả lời]
  
  Câu 2: [câu hỏi]
  Mục đích: [mục đích của câu hỏi]
  Gợi ý: [gợi ý trả lời]
  
  (Tương tự cho các câu tiếp theo)
  
  II. CÂU HỎI VỀ KINH NGHIỆM:
  (Tương tự như mẫu trên)
  
  III. CÂU HỎI VỀ TÍNH CÁCH VÀ PHÙ HỢP VĂN HÓA:
  (Tương tự như mẫu trên)
  
  QUAN TRỌNG: KHÔNG sử dụng bất kỳ ký tự định dạng markdown nào như **, *, _, # trong phản hồi. Không sử dụng số thứ tự như 1., 2. cho các câu hỏi. Sử dụng chính xác từ "Câu 1:", "Câu 2:" để bắt đầu mỗi câu hỏi.
`;
    
    // Gọi API OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "Bạn là một chuyên gia tuyển dụng với nhiều năm kinh nghiệm phỏng vấn. Nhiệm vụ của bạn là tạo câu hỏi phỏng vấn theo định dạng chuẩn không sử dụng markdown hoặc các ký tự đặc biệt. Mỗi câu hỏi phải đi kèm với mục đích và gợi ý trả lời rõ ràng." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });
    
    const questions = response.choices[0].message.content;
    
    // Lưu cache để tái sử dụng (3 ngày)
    apiCache.set(cacheKey, questions, 259200);
    
    return res.status(200).json({
      success: true,
      jobTitle: job.title,
      questions
    });
    
  } catch (error) {
    console.error("AI generate interview questions error:", error);
    
    let errorMessage = "Không thể tạo câu hỏi phỏng vấn. Vui lòng thử lại sau.";
    
    if (error.status === 401) {
      // Lỗi xác thực API
      errorMessage = "Lỗi xác thực API. Vui lòng liên hệ quản trị viên.";
      // Vô hiệu hóa AI tạm thời
      if (req.app && req.app.locals) {
        req.app.locals.aiEnabled = false;
      }
    } else if (error.status === 429) {
      errorMessage = "Đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau ít phút.";
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Cải thiện mô tả công việc bằng AI
 * POST /api/v1/ai/improve-description/:jobId
 */
export const improveJobDescription = async (req, res) => {
  try {
    // Kiểm tra nếu tính năng AI đã bị vô hiệu hóa
    if (!req.app.locals.aiEnabled) {
      return res.status(503).json({
        success: false,
        message: "Tính năng AI đang tạm thời không khả dụng. Vui lòng thử lại sau."
      });
    }
    
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "ID công việc là bắt buộc"
      });
    }
    
    // Kiểm tra cache trước
    const cacheKey = `improved_description_${jobId}`;
    const cachedDescription = apiCache.get(cacheKey);
    if (cachedDescription) {
      return res.status(200).json({
        success: true,
        improvedDescription: cachedDescription
      });
    }
    
    // Lấy thông tin công việc từ database
    const job = await Job.findById(jobId).populate({
      path: "company",
      select: "name industry location"
    });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc"
      });
    }
    
    // Kiểm tra quyền truy cập (người tạo job hoặc admin)
    if (req.id && req.id.toString() !== job.created_by.toString() && req.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật mô tả công việc này"
      });
    }
    
    // Tạo prompt cho AI
    const prompt = `
      Hãy viết lại mô tả công việc chuyên nghiệp, hấp dẫn và cấu trúc rõ ràng dựa trên các thông tin sau:
      
      Tiêu đề công việc: ${job.title}
      Công ty: ${job.company?.name || "Không có thông tin"}
      Ngành: ${job.company?.industry || "Không có thông tin"} 
      Địa điểm: ${job.location || "Không có thông tin"}
      Loại công việc: ${job.jobType || "Không có thông tin"}
      Mức kinh nghiệm: ${job.experienceLevel || "Không có thông tin"}
      Mức lương: ${job.salary ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(job.salary) : "Thỏa thuận"}
      Yêu cầu: ${Array.isArray(job.requirements) ? job.requirements.join(". ") : job.requirements || "Không có thông tin"}
      
      Mô tả hiện tại: "${job.description}"
      
      Hãy tạo một mô tả công việc có cấu trúc rõ ràng với các phần:
      - Giới thiệu về công ty và vị trí
      - Mô tả trách nhiệm công việc chi tiết và hấp dẫn
      - Yêu cầu và kỹ năng cần thiết (bổ sung từ thông tin yêu cầu đã cung cấp)
      - Quyền lợi và cơ hội phát triển
      - Lời kêu gọi ứng tuyển
      
      Hãy sử dụng từ ngữ chuyên nghiệp, cụ thể, tạo sự thu hút và làm nổi bật giá trị của vị trí công việc.
      KHÔNG bao gồm bất kỳ tiêu đề nào như "Mô tả công việc", "Yêu cầu", v.v. trong phần kết quả.
      Trả về kết quả là một đoạn văn liên tục, đã được định dạng với các đoạn văn rõ ràng.
    `;
    
    // Gọi API OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "Bạn là chuyên gia tư vấn nhân sự cao cấp, giỏi viết mô tả công việc chuyên nghiệp, thu hút và tối ưu hóa SEO." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const improvedDescription = response.choices[0].message.content;
    
    // Lưu cache để tái sử dụng (2 ngày)
    apiCache.set(cacheKey, improvedDescription, 172800);
    
    return res.status(200).json({
      success: true,
      improvedDescription,
      originalDescription: job.description
    });
    
  } catch (error) {
    console.error("AI improve description error:", error);
    
    let errorMessage = "Không thể cải thiện mô tả công việc. Vui lòng thử lại sau.";
    
    if (error.status === 401) {
      // Lỗi xác thực API
      errorMessage = "Lỗi xác thực API. Vui lòng liên hệ quản trị viên.";
      // Vô hiệu hóa AI tạm thời
      if (req.app && req.app.locals) {
        req.app.locals.aiEnabled = false;
      }
    } else if (error.status === 429) {
      errorMessage = "Đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau ít phút.";
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Cập nhật mô tả công việc trong database
 * PUT /api/v1/ai/update-description/:jobId
 */
export const updateJobDescription = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { description } = req.body;
    
    if (!jobId || !description) {
      return res.status(400).json({
        success: false,
        message: "ID công việc và mô tả mới là bắt buộc"
      });
    }
    
    // Tìm công việc cần cập nhật
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy công việc"
      });
    }
    
    // Kiểm tra quyền cập nhật
    if (req.id.toString() !== job.created_by.toString() && req.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật công việc này"
      });
    }
    
    // Cập nhật mô tả
    job.description = description;
    await job.save();
    
    // Xóa cache liên quan
    apiCache.clear(`summary_${jobId}`);
    apiCache.clear(`improved_description_${jobId}`);
    
    return res.status(200).json({
      success: true,
      message: "Cập nhật mô tả công việc thành công",
      job
    });
    
  } catch (error) {
    console.error("Update job description error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật mô tả công việc. Vui lòng thử lại sau.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};