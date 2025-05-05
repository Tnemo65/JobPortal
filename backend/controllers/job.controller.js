import { Application } from "../models/application.model.js";
import { Company } from "../models/company.model.js";
import { Job } from "../models/job.model.js";

export const postJob = async (req, res) => {
    try {
        const userId = req.id;
        // Thêm companyId vào destructuring để nhận đúng tên trường từ frontend
        const {title, description, requirements, salary, location, jobType, experienceLevel, company, companyId, position } = req.body;
        
        // Lấy ID công ty từ một trong hai trường (ưu tiên company nếu có)
        const actualCompanyId = company || companyId;
        
        console.log("Job data:", req.body);
        
        // Xác thực đầu vào
        if (!title || 
            !description || 
            !salary || 
            !location || 
            !jobType || 
            !actualCompanyId || 
            !experienceLevel || 
            !position) {
            return res.status(400).json({
                message: "Vui lòng điền đầy đủ thông tin công việc",
                success: false
            });
        }

        // Kiểm tra công ty tồn tại
        const companyData = await Company.findById(actualCompanyId);
        if (!companyData) {
            return res.status(404).json({
                message: "Không tìm thấy công ty",
                success: false
            });
        }

        // Kiểm tra quyền - cho phép admin tạo job cho bất kỳ công ty nào
        const userRole = req.role; // Lấy role từ middleware authentication
        if (userRole !== 'admin' && companyData.userId.toString() !== userId) {
            return res.status(403).json({
                message: "Bạn không có quyền đăng tin cho công ty này",
                success: false
            });
        }

        // Xử lý requirements dưới dạng mảng nếu có
        let requirementsArray = [];
        if (requirements) {
            if (typeof requirements === 'string') {
                requirementsArray = requirements.split(',').map(req => req.trim());
            } 
            else if (Array.isArray(requirements)) {
                requirementsArray = requirements;
            }
            else if (typeof requirements === 'object') {
                // Xử lý trường hợp requirements là object như { '0': 'Đẹp trai' }
                requirementsArray = Object.values(requirements).filter(Boolean);
            }
        }

        // Tạo công việc mới
        const newJob = await Job.create({
            title,
            description,
            requirements: requirementsArray,
            salary: Number(salary),
            experienceLevel,
            location,
            jobType,
            position: parseInt(position) || 1,
            company: actualCompanyId,
            created_by: userId
        });

        return res.status(201).json({ 
            job: newJob, 
            message: "Đăng tin tuyển dụng thành công",
            success: true 
        });
    } catch (error) {
        console.error("Post job error:", error);
        return res.status(500).json({
            message: "Không thể đăng tin tuyển dụng. Vui lòng thử lại sau.",
            success: false
        });
    }
};

// Lấy danh sách tất cả công việc (công khai)
export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";
        const category = req.query.category || "";
        const location = req.query.location || "";
        const type = req.query.type || "";
        
        // Xây dựng query dựa trên các tham số
        const query = {
            $and: [
                { $or: [
                    { title: { $regex: keyword, $options: "i" } },
                    { description: { $regex: keyword, $options: "i" } },
                    { skills: { $regex: keyword, $options: "i" } }
                ] },
                category ? { category: { $regex: category, $options: "i" } } : {},
                location ? { location: { $regex: location, $options: "i" } } : {},
                type ? { type: { $regex: type, $options: "i" } } : {},
                // Chỉ hiện các tin chưa hết hạn hoặc không có ngày hết hạn
                { $or: [
                    { closingDate: { $exists: false } },
                    { closingDate: null },
                    { closingDate: { $gt: new Date() } }
                ] }
            ]
        };

        // Define fields to select - only what's needed
        const projection = {
            title: 1,
            description: 1, 
            salary: 1,
            location: 1,
            type: 1,
            jobType: 1, 
            position: 1,
            company: 1,
            createdAt: 1,
            created_by: 1 // Thêm trường created_by để biết ai là người tạo job
        };

        // Lấy danh sách công việc từ cơ sở dữ liệu
        const jobs = await Job.find(query, projection)
            .populate({
                path: "company",
                select: "name logo website", // Only select needed fields
            })
            .populate({
                path: "created_by",
                select: "role", // Chỉ lấy role của người tạo
                model: "User" 
            })
            .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất
            .lean(); // Use lean() for better performance

        // Phân loại và sắp xếp công việc: admin lên đầu, sau đó theo thứ tự thời gian
        const sortedJobs = jobs.sort((a, b) => {
            // Nếu a là của admin và b không phải, a lên trước
            if (a.created_by?.role === 'admin' && b.created_by?.role !== 'admin') {
                return -1;
            }
            // Nếu b là của admin và a không phải, b lên trước
            if (b.created_by?.role === 'admin' && a.created_by?.role !== 'admin') {
                return 1;
            }
            // Nếu cả hai đều là admin hoặc cả hai đều không phải, sắp xếp theo thời gian
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Loại bỏ thông tin created_by trước khi gửi về client để bảo mật
        const sanitizedJobs = sortedJobs.map(job => {
            const { created_by, ...rest } = job;
            return rest;
        });

        return res.status(200).json({
            jobs: sanitizedJobs,
            success: true
        });
    } catch (error) {
        console.error("Get all jobs error:", error);
        return res.status(500).json({
            message: "Không thể lấy danh sách công việc. Vui lòng thử lại sau.",
            success: false
        });
    }
};

// Chi tiết công việc (công khai)
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        
        if (!jobId) {
            return res.status(400).json({
                message: "ID công việc là bắt buộc",
                success: false
            });
        }
        
        const job = await Job.findById(jobId)
            .populate({
                path: "company",
                select: "name description website location logo" // Only select needed fields
            })
            .populate({
                path: "applications",
                select: "applicant status" // Only select needed fields
            })
            .lean(); // Use lean() for better performance
            
        if (!job) {
            return res.status(404).json({
                message: "Không tìm thấy công việc",
                success: false
            });
        }
        
        return res.status(200).json({ 
            job, 
            success: true 
        });
    } catch (error) {
        console.error("Get job by ID error:", error);
        return res.status(500).json({
            message: "Không thể lấy thông tin công việc. Vui lòng thử lại sau.",
            success: false
        });
    }
};

// Lấy danh sách công việc của admin
export const getAdminJobs = async (req, res) => {
    try {
        const adminId = req.id;
        
        // Define fields to select - only what's needed
        const projection = {
            title: 1,
            createdAt: 1, 
            company: 1,
            applications: 1
        };
        
        const jobs = await Job.find({ created_by: adminId }, projection)
            .populate({
                path: 'company',
                select: 'name logo' // Only select needed fields
            })
            .sort({ createdAt: -1 })
            .lean(); // Use lean() for better performance
        
        // Add application counts for each job
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const applicationCount = job.applications ? job.applications.length : 0;
            return {
                ...job,
                applicationCount
            };
        }));
            
        return res.status(200).json({
            jobs: jobsWithCounts,
            success: true
        });
    } catch (error) {
        console.error("Get admin jobs error:", error);
        return res.status(500).json({
            message: "Không thể lấy danh sách tin tuyển dụng của bạn",
            success: false
        });
    }
};
