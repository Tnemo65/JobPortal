import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Notification } from '../models/notification.model.js';
import { apiCache } from "../utils/redis-cache.js";

export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "ID công việc là bắt buộc.",
                success: false
            });
        }
        
        // Kiểm tra xem người dùng đã apply cho job này chưa
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });

        if (existingApplication) {
            return res.status(400).json({
                message: "Bạn đã ứng tuyển vào vị trí này rồi",
                success: false
            });
        }

        // Kiểm tra công việc có tồn tại không
        const job = await Job.findById(jobId).populate('company');
        if (!job) {
            return res.status(404).json({
                message: "Không tìm thấy công việc",
                success: false
            });
        }
        
        // Kiểm tra xem job có còn tuyển dụng không
        if (job.closingDate && new Date(job.closingDate) < new Date()) {
            return res.status(400).json({
                message: "Công việc này đã hết hạn tuyển dụng",
                success: false
            });
        }

        // Tạo application mới
        const newApplication = await Application.create({
            job: jobId,
            applicant: userId,
        });

        // Thêm application vào job
        job.applications.push(newApplication._id);
        await job.save();

        // Thêm job vào danh sách appliedJobs của user
        const user = await User.findById(userId);
        if (!user.appliedJobs) {
            user.appliedJobs = [];
        }
        
        // Kiểm tra nếu jobId chưa tồn tại trong appliedJobs
        if (!user.appliedJobs.includes(jobId)) {
            user.appliedJobs.push(jobId);
            await user.save();
        }

        // Xóa cache nếu có
        apiCache.clear(`/api/v1/application/get`);
        apiCache.clear(`/api/v1/application/applied/${userId}`);

        // Tạo notification cho admin của công việc (người đã tạo job)
        const recruiterId = job.created_by;
        // Đếm số lượng ứng viên đã apply vào job này
        const totalApplicants = await Application.countDocuments({ job: job._id });
        
        // Thêm thông tin người ứng tuyển để hiển thị chi tiết hơn
        const applicant = await User.findById(userId).select('fullname email');
        const applicantName = applicant ? applicant.fullname : 'Một ứng viên';
        
        await Notification.create({
            user: recruiterId,
            message: `${applicantName} vừa ứng tuyển vào vị trí: ${job.title}. Tổng số ứng viên hiện tại: ${totalApplicants}`,
            meta: { 
                jobId: job._id, 
                applicantId: userId, 
                totalApplicants,
                applicationId: newApplication._id
            }
        });

        // Return the applied job details for immediate UI update
        const populatedJob = await Job.findById(jobId)
            .populate({
                path: 'company',
                select: 'name logo website location'
            }).lean();

        return res.status(201).json({
            message: "Ứng tuyển thành công.",
            success: true,
            appliedJob: {
                ...populatedJob,
                status: 'pending' // Default status for new applications
            }
        });
    } catch (error) {
        console.error("Apply job error:", error);
        
        // Xử lý các loại lỗi cụ thể
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Dữ liệu ứng tuyển không hợp lệ. Vui lòng kiểm tra lại.",
                success: false,
                details: error.message
            });
        }
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                message: "ID công việc không đúng định dạng",
                success: false
            });
        }
        
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({
                message: "Bạn đã ứng tuyển vào vị trí này rồi",
                success: false
            });
        }
        
        // Lỗi khác
        return res.status(500).json({
            message: "Đã xảy ra lỗi khi ứng tuyển. Vui lòng thử lại sau.",
            success: false,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.id;
        
        // Explicitly check user ID from auth token
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized access.",
                success: false
            });
        }
        
        // Use lean() for better performance - it returns plain JavaScript objects
        const user = await User.findById(userId)
            .select('appliedJobs')
            .populate({
                path: 'appliedJobs',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'company',
                    select: 'name logo website' // Only select needed fields
                }
            })
            .lean();
            
        if (!user || !user.appliedJobs) {
            return res.status(200).json({
                appliedJobs: [],
                success: true
            });
        }
        
        // Get application status information in a single query
        const applications = await Application.find(
            { applicant: userId },
            { job: 1, status: 1, _id: 1 }
        ).lean();
        
        // Create a map for efficient lookups
        const applicationStatusMap = {};
        applications.forEach(app => {
            applicationStatusMap[app.job.toString()] = app.status;
        });
        
        // Enrich job objects with application status
        const enrichedJobs = user.appliedJobs.map(job => {
            // Convert to a plain object if it's not already
            const jobObj = typeof job.toObject === 'function' ? job.toObject() : job;
            
            return {
                ...jobObj,
                status: applicationStatusMap[job._id.toString()] || 'pending'
            };
        });

        // Add debugging information
        console.log(`Retrieved ${enrichedJobs.length} applied jobs for user ${userId}`);

        return res.status(200).json({
            appliedJobs: enrichedJobs,
            success: true
        });
    } catch (error) {
        console.error("Get applied jobs error:", error);
        return res.status(500).json({
            message: "Không thể lấy danh sách công việc đã ứng tuyển",
            success: false
        });
    }
};

// Admin xem các ứng viên đã ứng tuyển vào job
export const getApplicants = async (req, res) => {
    try {
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "ID công việc là bắt buộc",
                success: false
            });
        }

        // Kiểm tra job có tồn tại không
        const job = await Job.findById(jobId).populate({
            path: 'applications',
            options: {sort: {createdAt: -1}},
            populate: {
                path: 'applicant'
            }
        });
        
        if (!job) {
            return res.status(404).json({
                message: 'Không tìm thấy công việc.',
                success: false
            });
        }
        
        // Kiểm tra xem người dùng có phải là người tạo job không
        if (job.created_by.toString() !== req.id) {
            return res.status(403).json({
                message: 'Bạn không có quyền xem danh sách ứng viên của công việc này',
                success: false
            });
        }

        return res.status(200).json({
            job, 
            success: true
        });
    } catch (error) {
        console.error("Get applicants error:", error);
        return res.status(500).json({
            message: "Không thể lấy danh sách ứng viên",
            success: false
        });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const {status} = req.body;
        const applicationId = req.params.id;
        
        if (!applicationId) {
            return res.status(400).json({
                message: "ID ứng tuyển là bắt buộc",
                success: false
            });
        }

        if (!status) {
            return res.status(400).json({
                message: 'Trạng thái là bắt buộc',
                success: false
            });
        }
        
        // Kiểm tra trạng thái hợp lệ
        const validStatuses = ['pending', 'accepted', 'rejected', 'interview'];
        if (!validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({
                message: 'Trạng thái không hợp lệ',
                success: false
            });
        }

        // Tìm application theo ID
        const application = await Application.findById(applicationId).populate({
            path: 'job',
            select: 'title created_by'
        });
        
        if (!application) {
            return res.status(404).json({
                message: "Không tìm thấy hồ sơ ứng tuyển",
                success: false
            });
        }
        
        // Kiểm tra xem người dùng có phải là người tạo job không
        if (application.job.created_by.toString() !== req.id) {
            return res.status(403).json({
                message: "Bạn không có quyền cập nhật trạng thái hồ sơ này",
                success: false
            });
        }

        // Cập nhật trạng thái
        application.status = status.toLowerCase();
        await application.save();

        // Tạo thông báo cho ứng viên
        const applicantId = application.applicant;
        let notifyMsg = '';
        let meta = { applicationId: application._id, jobId: application.job._id };
        
        if (status.toLowerCase() === 'accepted') {
            notifyMsg = `Hồ sơ ứng tuyển vị trí ${application.job.title} của bạn đã được chấp nhận. Vui lòng chờ lịch phỏng vấn!`;
        } else if (status.toLowerCase() === 'rejected') {
            notifyMsg = `Hồ sơ ứng tuyển vị trí ${application.job.title} của bạn không được chấp nhận. Cảm ơn bạn đã quan tâm!`;
        } else if (status.toLowerCase() === 'interview') {
            notifyMsg = `Bạn được mời phỏng vấn cho vị trí ${application.job.title}. Vui lòng kiểm tra email để biết thêm chi tiết!`;
        }
        
        if (notifyMsg) {
            await Notification.create({
                user: applicantId,
                message: notifyMsg,
                meta
            });
        }

        return res.status(200).json({
            message: "Cập nhật trạng thái thành công",
            success: true
        });
    } catch (error) {
        console.error("Update application status error:", error);
        return res.status(500).json({
            message: "Không thể cập nhật trạng thái ứng tuyển",
            success: false
        });
    }
};