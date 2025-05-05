import { Company } from "../models/company.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const registerCompany = async (req, res) => {
    try {
        const { companyName, description, website, location } = req.body;
        const userId = req.id;
        
        // Kiểm tra dữ liệu đầu vào
        if (!companyName) {
            return res.status(400).json({
                message: "Tên công ty là bắt buộc",
                success: false
            });
        }
        
        // Kiểm tra website hợp lệ (nếu có)
        if (website) {
            try {
                new URL(website);
            } catch (error) {
                return res.status(400).json({
                    message: "URL website không hợp lệ",
                    success: false
                });
            }
        }
        
        // Kiểm tra trùng tên công ty
        const existingCompany = await Company.findOne({ 
            name: { $regex: new RegExp(`^${companyName}$`, 'i') }
        });
        
        if (existingCompany) {
            return res.status(400).json({
                message: "Tên công ty đã được sử dụng",
                success: false
            });
        }

        // Xử lý upload logo nếu có
        let logo;
        if (req.file) {
            try {
                const fileUri = getDataUri(req.file);
                const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                    folder: "job_portal/company_logos"
                });
                logo = cloudResponse.secure_url;
            } catch (uploadError) {
                console.error("Logo upload error:", uploadError);
                return res.status(400).json({
                    message: "Không thể tải lên logo. Vui lòng thử lại.",
                    success: false
                });
            }
        }
        
        // Tạo công ty mới - chỉ sử dụng trường userId theo đúng schema
        const company = await Company.create({
            name: companyName,
            description: description || "",
            website: website || "",
            location: location || "",
            logo: logo || "",
            userId: userId
        });

        return res.status(201).json({
            message: "Đăng ký công ty thành công",
            company,
            success: true
        });
    } catch (error) {
        console.error("Register company error:", error);
        return res.status(500).json({
            message: "Không thể đăng ký công ty. Vui lòng thử lại sau.",
            success: false
        });
    }
};

export const getCompany = async (req, res) => {
    try {
        const userId = req.id; // ID người dùng đã đăng nhập
        
        const companies = await Company.find({ userId: userId })
            .sort({ createdAt: -1 });
            
        return res.status(200).json({
            companies,
            success: true
        });
    } catch (error) {
        console.error("Get companies error:", error);
        return res.status(500).json({
            message: "Không thể lấy danh sách công ty. Vui lòng thử lại sau.",
            success: false
        });
    }
};

// Lấy thông tin công ty theo ID
export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;
        
        if (!companyId) {
            return res.status(400).json({
                message: "ID công ty là bắt buộc",
                success: false
            });
        }
        
        const company = await Company.findById(companyId);
        
        if (!company) {
            return res.status(404).json({
                message: "Không tìm thấy công ty",
                success: false
            });
        }
        
        return res.status(200).json({
            company,
            success: true
        });
    } catch (error) {
        console.error("Get company by ID error:", error);
        return res.status(500).json({
            message: "Không thể lấy thông tin công ty. Vui lòng thử lại sau.",
            success: false
        });
    }
};

export const updateCompany = async (req, res) => {
    try {
        const { name, description, website, location } = req.body;
        const companyId = req.params.id;
        
        // Kiểm tra dữ liệu đầu vào
        if (!name && !description && !website && !location && !req.file) {
            return res.status(400).json({
                message: "Vui lòng cung cấp ít nhất một thông tin cần cập nhật",
                success: false
            });
        }
        
        // Kiểm tra website hợp lệ (nếu có)
        if (website) {
            try {
                new URL(website);
            } catch (error) {
                return res.status(400).json({
                    message: "URL website không hợp lệ",
                    success: false
                });
            }
        }
        
        // Kiểm tra trùng tên công ty (nếu đổi tên)
        if (name) {
            const existingCompany = await Company.findOne({
                _id: { $ne: companyId },
                name: { $regex: new RegExp(`^${name}$`, 'i') }
            });
            
            if (existingCompany) {
                return res.status(400).json({
                    message: "Tên công ty đã được sử dụng bởi công ty khác",
                    success: false
                });
            }
        }
        
        // Xử lý upload logo nếu có
        let logo;
        if (req.file) {
            try {
                const fileUri = getDataUri(req.file);
                const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                    folder: "job_portal/company_logos"
                });
                logo = cloudResponse.secure_url;
            } catch (uploadError) {
                console.error("Logo upload error:", uploadError);
                return res.status(400).json({
                    message: "Không thể tải lên logo. Vui lòng thử lại.",
                    success: false
                });
            }
        }
        
        // Tạo object chứa các thông tin cần cập nhật
        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (website) updateData.website = website;
        if (location) updateData.location = location;
        if (logo) updateData.logo = logo;
        
        // Cập nhật công ty
        const company = await Company.findByIdAndUpdate(
            companyId, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        if (!company) {
            return res.status(404).json({
                message: "Không tìm thấy công ty",
                success: false
            });
        }
        
        return res.status(200).json({
            message: "Cập nhật thông tin công ty thành công",
            company,
            success: true
        });
    } catch (error) {
        console.error("Update company error:", error);
        return res.status(500).json({
            message: "Không thể cập nhật thông tin công ty. Vui lòng thử lại sau.",
            success: false
        });
    }
};