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
      Format tóm tắt dưới dạng điểm đạn (bullet points).
      
      Tiêu đề: ${job.title}
      Công ty: ${job.company.name}
      Địa điểm: ${job.location}
      Loại công việc: ${job.jobType}
      Mức kinh nghiệm: ${job.experienceLevel}
      Mô tả: ${job.description}
      Yêu cầu: ${Array.isArray(job.requirements) ? job.requirements.join(". ") : job.requirements}
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
    return res.status(500).json({
      success: false,
      message: "Không thể tóm tắt thông tin công việc. Vui lòng thử lại sau."
    });
  }
};

// Tự động tạo tóm tắt khi công việc được tạo
export const generateJobSummary = async (jobId) => {
  try {
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
    return null;
  }
};


export const testJobSummary = async (req, res) => {
  try {
    // Lấy sample ID từ query param hoặc dùng mặc định
    const sampleId = req.query.sample || "developer";

    // Các mẫu công việc để test
    const jobSamples = {
      developer: {
        title: "Lập trình viên Backend",
        company: { name: "Tech Solution JSC" },
        description: "Chúng tôi đang tìm kiếm một Lập trình viên Backend có kinh nghiệm để tham gia vào dự án phát triển hệ thống thanh toán trực tuyến. Bạn sẽ làm việc với các công nghệ hiện đại như Node.js, MongoDB, và AWS để xây dựng các API RESTful hiệu suất cao và an toàn.",
        requirements: ["Có ít nhất 2 năm kinh nghiệm với Node.js và Express", "Thành thạo MongoDB và Redis", "Hiểu biết về bảo mật web và xác thực người dùng", "Kinh nghiệm làm việc với Docker và Kubernetes là một lợi thế"],
        salary: 25000000,
        experienceLevel: "Trung cấp",
        location: "Hà Nội",
        jobType: "Toàn thời gian"
      },
      marketing: {
        title: "Chuyên viên Marketing",
        company: { name: "Global Brand Vietnam" },
        description: "Global Brand Vietnam cần tuyển Chuyên viên Marketing để lên kế hoạch và triển khai các chiến dịch quảng cáo trên các nền tảng số. Người ứng tuyển sẽ phân tích dữ liệu thị trường, quản lý nội dung truyền thông xã hội và làm việc với đội ngũ sáng tạo để phát triển tài liệu marketing.",
        requirements: ["Bằng cử nhân Marketing, Truyền thông hoặc tương đương", "Kinh nghiệm 1-3 năm trong digital marketing", "Thành thạo Google Analytics và các công cụ quảng cáo trên Facebook, Google", "Kỹ năng phân tích và báo cáo dữ liệu tốt"],
        salary: 18000000,
        experienceLevel: "Sơ cấp",
        location: "Hồ Chí Minh",
        jobType: "Toàn thời gian"
      },
      designer: {
        title: "UI/UX Designer",
        company: { name: "Creative Studio" },
        description: "Creative Studio đang tìm kiếm một UI/UX Designer tài năng để thiết kế giao diện người dùng cho các ứng dụng di động và web. Bạn sẽ làm việc trong môi trường năng động, sáng tạo và có cơ hội học hỏi từ các chuyên gia thiết kế hàng đầu.",
        requirements: ["Tối thiểu 2 năm kinh nghiệm trong UI/UX Design", "Thành thạo Figma, Adobe XD và Photoshop", "Portfolio thể hiện các dự án thiết kế ấn tượng", "Kinh nghiệm với design system và responsive design"],
        salary: 22000000,
        experienceLevel: "Trung cấp",
        location: "Đà Nẵng",
        jobType: "Toàn thời gian"
      },
      remote: {
        title: "Frontend Developer (Remote)",
        company: { name: "International Tech" },
        description: "International Tech đang tìm kiếm Frontend Developer làm việc từ xa. Bạn sẽ phát triển giao diện người dùng cho các ứng dụng web sử dụng React và TypeScript. Chúng tôi cung cấp lịch làm việc linh hoạt và môi trường quốc tế.",
        requirements: ["Kinh nghiệm tối thiểu 3 năm với React", "Thành thạo TypeScript và JavaScript", "Hiểu biết về Redux, React Router và các thư viện React phổ biến", "Khả năng giao tiếp tiếng Anh tốt"],
        salary: 35000000,
        experienceLevel: "Cao cấp",
        location: "Remote",
        jobType: "Toàn thời gian"
      },
      intern: {
        title: "Thực tập sinh Kế toán",
        company: { name: "Finance Group" },
        description: "Finance Group đang tìm kiếm Thực tập sinh Kế toán để hỗ trợ bộ phận kế toán trong các hoạt động hàng ngày. Đây là cơ hội tuyệt vời để học hỏi và phát triển kỹ năng kế toán trong môi trường chuyên nghiệp.",
        requirements: ["Sinh viên năm cuối ngành Kế toán, Tài chính", "Có kiến thức cơ bản về kế toán và Excel", "Chăm chỉ, cẩn thận và có tinh thần học hỏi", "Có thể làm việc tối thiểu 3 tháng"],
        salary: 5000000,
        experienceLevel: "Thực tập",
        location: "Hồ Chí Minh",
        jobType: "Bán thời gian"
      }
    };

    // Kiểm tra mẫu tồn tại
    if (!jobSamples[sampleId]) {
      return res.status(400).json({
        success: false,
        message: "Mẫu công việc không tồn tại",
        availableSamples: Object.keys(jobSamples)
      });
    }

    // Lấy mẫu công việc từ danh sách
    const jobSample = jobSamples[sampleId];

    // Tạo prompt cho API OpenAI
    const prompt = `
      Tóm tắt ngắn gọn thông tin công việc sau đây trong khoảng 100-150 từ.
      Tập trung vào các kỹ năng quan trọng, trách nhiệm chính và yêu cầu kinh nghiệm.
      Format tóm tắt dưới dạng điểm đạn (bullet points).
      
      Tiêu đề: ${jobSample.title}
      Công ty: ${jobSample.company.name}
      Địa điểm: ${jobSample.location}
      Loại công việc: ${jobSample.jobType}
      Mức kinh nghiệm: ${jobSample.experienceLevel}
      Mô tả: ${jobSample.description}
      Yêu cầu: ${Array.isArray(jobSample.requirements) ? jobSample.requirements.join(". ") : jobSample.requirements}
    `;

    // Khởi tạo OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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
    
    // Trả về kết quả với thông tin mẫu đầy đủ
    return res.status(200).json({
      success: true,
      jobDetails: jobSample,
      summary,
      note: "Đây là API test dùng để demo chức năng tóm tắt công việc bằng AI"
    });
    
  } catch (error) {
    console.error("AI test job summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tạo tóm tắt công việc. Vui lòng thử lại sau.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};