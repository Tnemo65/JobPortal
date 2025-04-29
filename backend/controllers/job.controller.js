import { Application } from "../models/application.model.js";
import { Company } from "../models/company.model.js";
import { Job } from "../models/job.model.js";

export const postJob = async (req, res) => {
    try {
        const userId = req.id;
        const {title, description, salary, location, type, skills, category, company: companyId, position, closingDate } = req.body;

        // Xác thực đầu vào
        if (!title || !description || !location || !type || !category || !companyId) {
            return res.status(400).json({
                message: "Vui lòng điền đầy đủ thông tin công việc",
                success: false
            });
        }

        // Kiểm tra tính hợp lệ của một số trường đặc biệt
        if (closingDate && new Date(closingDate) < new Date()) {
            return res.status(400).json({
                message: "Ngày hết hạn phải sau ngày hiện tại",
                success: false
            });
        }

        // Kiểm tra quyền sở hữu công ty
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Không tìm thấy công ty",
                success: false
            });
        }

        if (company.created_by.toString() !== userId) {
            return res.status(403).json({
                message: "Bạn không có quyền đăng tin cho công ty này",
                success: false
            });
        }

        // Xử lý mảng skills
        let skillsArray = [];
        if (skills) {
            skillsArray = typeof skills === 'string' 
                ? skills.split(',').map(skill => skill.trim()) 
                : Array.isArray(skills) ? skills : [];
        }

        // Tạo công việc mới
        const newJob = await Job.create({
            title,
            description,
            salary,
            location,
            type,
            category,
            company: companyId,
            position: position || 1,
            closingDate,
            skills: skillsArray,
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
            createdAt: 1
        };

        const jobs = await Job.find(query, projection)
            .populate({
                path: "company",
                select: "name logo website" // Only select needed fields
            })
            .sort({ createdAt: -1 })
            .lean(); // Use lean() for better performance

        return res.status(200).json({
            jobs,
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

// Lấy danh sách công việc của recruiter
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
