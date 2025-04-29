import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { apiCache } from "../utils/redis-cache.js";

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;

        // Kiểm tra đầy đủ dữ liệu
        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Vui lòng điền đầy đủ thông tin",
                success: false,
            });
        }

        // Kiểm tra email hợp lệ
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Email không hợp lệ",
                success: false,
            });
        }

        // Kiểm tra số điện thoại hợp lệ
        const phoneRegex = /^\d{10,15}$/;
        if (!phoneRegex.test(phoneNumber.toString())) {
            return res.status(400).json({
                message: "Số điện thoại không hợp lệ",
                success: false,
            });
        }

        // Kiểm tra vai trò hợp lệ
        if (role !== 'student' && role !== 'recruiter') {
            return res.status(400).json({
                message: "Vai trò không hợp lệ",
                success: false,
            });
        }

        // Xử lý file upload
        const file = req.file;
        let cloudResponse = null;
        
        if (file) {
            try {
                const fileUri = getDataUri(file);
                // Kiểm tra định dạng file
                const validExtensions = ['.pdf', '.doc', '.docx'];
                const fileExt = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
                
                if (!validExtensions.includes(fileExt)) {
                    return res.status(400).json({
                        message: "Chỉ chấp nhận file PDF, DOC hoặc DOCX",
                        success: false,
                    });
                }
                
                // Upload file với định dạng đúng và tên có ý nghĩa
                const isPDF = file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf');
                if (isPDF) {
                    const fileName = `resume_register_${Date.now()}${fileExt}`;
                    cloudResponse = await cloudinary.uploader.upload(fileUri.content, { 
                        resource_type: "raw",
                        folder: "job_portal/resumes",
                        public_id: fileName,
                        use_filename: true
                    });
                } else {
                    // Upload như bình thường với các định dạng khác
                    cloudResponse = await cloudinary.uploader.upload(fileUri.content, { 
                        resource_type: "raw",
                        folder: "job_portal/resumes"
                    });
                }
            } catch (uploadError) {
                console.error("File upload error:", uploadError);
                return res.status(400).json({
                    message: "Upload file thất bại. Vui lòng thử lại.",
                    success: false
                });
            }
        }

        if (!cloudResponse) {
            return res.status(400).json({
                message: "Resume là bắt buộc",
                success: false,
            });
        }

        // Kiểm tra email đã tồn tại chưa
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: "Email đã được sử dụng",
                success: false,
            });
        }

        // Băm mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo người dùng mới với dữ liệu đã xác thực
        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: {
                resume: cloudResponse.secure_url,
                resumeOriginalName: file.originalname,
            },
        });

        return res.status(201).json({
            message: "Tạo tài khoản thành công",
            success: true,
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ 
            message: "Lỗi server. Vui lòng thử lại sau.", 
            success: false 
        });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Vui lòng điền đầy đủ thông tin đăng nhập",
                success: false
            });
        }

        // Kiểm tra email hợp lệ
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Email không hợp lệ",
                success: false
            });
        }

        // Chỉ trả về lỗi chung để tránh thông tin về sự tồn tại của tài khoản
        const standardErrorMessage = "Email hoặc mật khẩu không chính xác";
        
        // Tìm người dùng theo email
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: standardErrorMessage,
                success: false
            });
        }

        // Kiểm tra mật khẩu
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: standardErrorMessage,
                success: false
            });
        }

        // Kiểm tra vai trò
        if (role !== user.role) {
            return res.status(401).json({
                message: "Tài khoản không tồn tại với vai trò này",
                success: false
            });
        }

        // Tạo JWT token
        const tokenData = {
            userId: user._id
        };
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        // Chuẩn bị thông tin người dùng để trả về client (bỏ mật khẩu)
        const userData = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };

        // Đặt cookie và trả về thông tin đăng nhập thành công
        return res.status(200).cookie("token", token, { 
            maxAge: 1 * 24 * 60 * 60 * 1000, 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' 
        }).json({
            message: `Chào mừng trở lại ${userData.fullname}`,
            user: userData,
            success: true
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Lỗi server. Vui lòng thử lại sau.",
            success: false
        });
    }
}
export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { 
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        }).json({
            message: "Logged out successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Logout failed",
            success: false
        });
    }
};

// SSO Authentication success handler
export const ssoAuthSuccess = async (req, res) => {
    try {
        const user = req.user;
        // Create token for the authenticated user
        const tokenData = {
            userId: user._id
        };
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        // Format user data for response
        const userData = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };

        // Set the token in a cookie and redirect to the frontend
        res.cookie("token", token, { 
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        
        // Redirect to frontend with success flag
        res.redirect(`http://localhost:5173/sso-callback?success=true`);
    } catch (error) {
        console.log(error);
        res.redirect(`http://localhost:5173/sso-callback?success=false&error=${error.message}`);
    }
};

// SSO Authentication failure handler
export const ssoAuthFailure = (req, res) => {
    res.redirect(`http://localhost:5173/sso-callback?success=false&error=Authentication failed`);
};

// Get user profile after SSO login
export const getSsoProfile = async (req, res) => {
    try {
        const userId = req.id; // From isAuthenticated middleware
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false
            });
        }
        
        // Format user data for response
        const userData = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };
        
        return res.status(200).json({
            user: userData,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Something went wrong.",
            success: false
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, githubUsername, linkedinUsername, facebookUsername, resumeTitle } = req.body;
        
        // Xử lý files được upload từ multiFieldUpload middleware
        let resumeCloudResponse = null;
        let profilePhotoCloudResponse = null;
        let hasChanges = false; // Track if there are actual changes

        const userId = req.id; // middleware authentication
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng",
                success: false
            });
        }

        // Initialize profile if it doesn't exist
        if (!user.profile) {
            user.profile = {};
            hasChanges = true;
        }

        // Kiểm tra xem có files được upload không
        if (req.files) {
            // Xử lý file resume nếu có
            if (req.files.resume && req.files.resume[0]) {
                hasChanges = true; // File uploads always count as changes
                try {
                    const resumeFile = req.files.resume[0];
                    const fileUri = getDataUri(resumeFile);
                    // Nếu là PDF thì upload với resource_type: 'raw', nếu là ảnh thì để mặc định
                    const isPDF = resumeFile.mimetype === 'application/pdf' || resumeFile.originalname.endsWith('.pdf');
                    
                    // Xóa file CV cũ trên Cloudinary nếu có
                    if (user.profile && user.profile.resume) {
                        try {
                            // Lấy public_id từ URL - cần xóa phần prefix như https://res.cloudinary.com/...
                            let oldResumeUrl = '';
                            if (typeof user.profile.resume === 'string') {
                                oldResumeUrl = user.profile.resume;
                            } else if (user.profile.resume.url) {
                                oldResumeUrl = user.profile.resume.url;
                            }
                            
                            if (oldResumeUrl) {
                                // Lấy chỉ phần public_id từ URL 
                                const urlParts = oldResumeUrl.split('/');
                                // Format của cloudinary url: https://res.cloudinary.com/{cloud_name}/{resource_type}/{type}/{public_id}
                                if (urlParts.length >= 2) {
                                    // Lấy tên file (bao gồm cả folder nếu có)
                                    const publicIdWithExt = urlParts.slice(urlParts.indexOf('job_portal')).join('/');
                                    // Loại bỏ phần mở rộng file nếu có
                                    const publicId = publicIdWithExt.split('.')[0];
                                    
                                    console.log(`Xóa CV cũ: ${publicId}`);
                                    // Xóa file cũ trên Cloudinary
                                    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
                                }
                            }
                        } catch (deleteError) {
                            console.error("Không thể xóa CV cũ:", deleteError);
                            // Không throw lỗi, vẫn tiếp tục upload CV mới
                        }
                    }
                    
                    if (isPDF) {
                        // Lấy phần mở rộng từ tên file gốc
                        const fileExt = resumeFile.originalname.substring(resumeFile.originalname.lastIndexOf('.'));
                        // Tạo tên file có ý nghĩa bao gồm cả phần mở rộng
                        const fileName = `resume_${userId}_${Date.now()}${fileExt}`;
                        
                        resumeCloudResponse = await cloudinary.uploader.upload(fileUri.content, { 
                            resource_type: "raw",
                            folder: "job_portal/resumes",
                            public_id: fileName, // Đặt public_id có phần mở rộng
                            use_filename: true, // Sử dụng tên file trong URL
                        });
                        
                        // Lưu tên file gốc để hiển thị
                        resumeCloudResponse.originalName = resumeFile.originalname;
                    } else {
                        resumeCloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                            folder: "job_portal/resumes"
                        });
                    }
                } catch (uploadError) {
                    console.error("Resume upload error:", uploadError);
                    return res.status(400).json({
                        message: "Không thể tải CV lên. Vui lòng thử lại.",
                        success: false
                    });
                }
            }
            
            // Xử lý file profilePhoto nếu có
            if (req.files.profilePhoto && req.files.profilePhoto[0]) {
                hasChanges = true; // File uploads always count as changes
                try {
                    const photoFile = req.files.profilePhoto[0];
                    const fileUri = getDataUri(photoFile);
                    profilePhotoCloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                        folder: "job_portal/profile_photos"
                    });
                } catch (uploadError) {
                    console.error("Profile photo upload error:", uploadError);
                    return res.status(400).json({
                        message: "Không thể tải ảnh đại diện lên. Vui lòng thử lại.",
                        success: false
                    });
                }
            }
            
            // Xử lý file nếu được gửi với tên field là 'file' (để tương thích ngược)
            if (req.files.file && req.files.file[0]) {
                hasChanges = true; // File uploads always count as changes
                try {
                    const file = req.files.file[0];
                    const fileUri = getDataUri(file);
                    const isPDF = file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf');
                    if (isPDF) {
                        resumeCloudResponse = await cloudinary.uploader.upload(fileUri.content, { 
                            resource_type: "raw",
                            folder: "job_portal/resumes"
                        });
                    } else {
                        profilePhotoCloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                            folder: "job_portal/profile_photos"
                        });
                    }
                } catch (uploadError) {
                    console.error("File upload error:", uploadError);
                }
            }
        }

        let skillsArray = [];
        if(req.body.skills){
            try {
                // Parse JSON string to array if it's a JSON string
                if (typeof req.body.skills === 'string' && req.body.skills.startsWith('[')) {
                    skillsArray = JSON.parse(req.body.skills);
                } 
                // Otherwise handle as comma-separated string (backward compatibility)
                else {
                    skillsArray = req.body.skills.split(",").map(skill => skill.trim());
                }
                
                // Validate each skill (2-20 chars, valid characters)
                const validSkillRegex = /^[a-zA-Z0-9\s\-\.+#]{2,20}$/;
                const validSkills = skillsArray.filter(skill => 
                    typeof skill === 'string' && 
                    validSkillRegex.test(skill)
                );
                
                // Limit to 15 skills
                skillsArray = validSkills.slice(0, 15);
                
                // Compare skills arrays
                const currentSkills = user.profile.skills || [];
                if (skillsArray.length !== currentSkills.length || 
                    JSON.stringify(skillsArray.sort()) !== JSON.stringify([...currentSkills].sort())) {
                    hasChanges = true;
                }
            } catch (err) {
                console.error("Error parsing skills:", err);
                // If error parsing, default to empty array
                skillsArray = [];
            }
        }
        
        // Xác thực email nếu được cập nhật
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    message: "Email này đã được sử dụng bởi tài khoản khác",
                    success: false
                });
            }
            user.email = email; // Update the email
            hasChanges = true;
        }
        
        // Check individual fields for changes
        if(fullname && fullname !== user.fullname) {
            user.fullname = fullname;
            hasChanges = true;
        }
        
        // Email is already handled above
        
        if(phoneNumber && phoneNumber !== user.phoneNumber) {
            user.phoneNumber = phoneNumber;
            hasChanges = true;
        }
        
        // Bio needs special handling due to encryption/decryption
        if(bio !== undefined) {
            // Directly assign the bio value - the schema's setter will handle encryption
            if(bio !== user.profile.bio) {
                user.profile.bio = bio;
                hasChanges = true;
            }
        }
        
        if(skillsArray.length > 0) {
            user.profile.skills = skillsArray;
            // hasChanges already set when comparing skills
        }
        
        if(githubUsername !== undefined && githubUsername !== user.profile.githubUsername) {
            user.profile.githubUsername = githubUsername;
            hasChanges = true;
        }
        
        if(linkedinUsername !== undefined && linkedinUsername !== user.profile.linkedinUsername) {
            user.profile.linkedinUsername = linkedinUsername;
            hasChanges = true;
        }
        
        if(facebookUsername !== undefined && facebookUsername !== user.profile.facebookUsername) {
            user.profile.facebookUsername = facebookUsername;
            hasChanges = true;
        }
        
        // XỬ LÝ RESUME - HOÀN TOÀN MỚI
        // 1. Xử lý nếu có resume mới được tải lên
        if (resumeCloudResponse) {
            // Tạo đối tượng resume mới
            user.profile.resume = {
                url: resumeCloudResponse.secure_url,
                title: resumeTitle || 'Resume',
                originalName: resumeCloudResponse.originalName
            };
            hasChanges = true;
        } 
        // 2. Nếu không có file mới nhưng có resumeTitle mới
        else if (resumeTitle) {
            const currentTitle = typeof user.profile.resume === 'object' ? 
                (user.profile.resume?.title || '') : '';
            
            if (resumeTitle !== currentTitle) {
                hasChanges = true;
                
                // Nếu profile.resume là chuỗi, chuyển đổi thành đối tượng
                if (typeof user.profile.resume === 'string') {
                    const currentUrl = user.profile.resume;
                    user.profile.resume = {
                        url: currentUrl,
                        title: resumeTitle
                    };
                } 
                // Nếu profile.resume là đối tượng, chỉ cập nhật title
                else if (user.profile.resume && typeof user.profile.resume === 'object') {
                    user.profile.resume.title = resumeTitle;
                }
                // Nếu chưa có resume nhưng có title, tạo đối tượng trống
                else {
                    user.profile.resume = {
                        title: resumeTitle
                    };
                }
            }
        }
        // 3. Nếu resume hiện tại là chuỗi nhưng không có dữ liệu mới
        else if (user.profile.resume && typeof user.profile.resume === 'string') {
            // Chuyển đổi thành đối tượng
            const currentUrl = user.profile.resume;
            user.profile.resume = {
                url: currentUrl,
                title: 'Resume'
            };
            hasChanges = true;
        }
        
        // Cập nhật ảnh profile nếu có
        if(profilePhotoCloudResponse) {
            user.profile.profilePhoto = profilePhotoCloudResponse.secure_url;
            hasChanges = true;
        }

        // Only save if there are actual changes
        if (hasChanges) {
            await user.save();

            // Chuẩn bị dữ liệu người dùng để trả về
            const userData = {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                profile: user.profile
            }

            return res.status(200).json({
                message: "Hồ sơ đã được cập nhật thành công",
                user: userData,
                success: true,
                changes: true
            });
        } else {
            // No changes detected
            // Still return the user data for consistency
            const userData = {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                profile: user.profile
            }
            
            return res.status(200).json({
                message: "Không có thông tin nào được thay đổi",
                user: userData,
                success: true,
                changes: false
            });
        }
    } catch (error) {
        console.error("Profile update error:", error);
        return res.status(500).json({
            message: "Không thể cập nhật hồ sơ. Vui lòng thử lại sau.",
            success: false
        });
    }
};

export const saveJob = async (req, res) => {
    try {
        const userId = req.id;
        const { jobId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false
            });
        }

        // Check if job is already saved
        if (user.savedJobs.includes(jobId)) {
            return res.status(400).json({
                message: "Job already saved.",
                success: false
            });
        }

        // Add job to savedJobs
        user.savedJobs.push(jobId);
        await user.save();

        // Clear cache for saved jobs
        apiCache.clear("/api/v1/user/jobs/saved");

        return res.status(200).json({
            message: "Job saved successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Something went wrong.",
            success: false
        });
    }
};

export const unsaveJob = async (req, res) => {
    try {
        const userId = req.id;
        const { jobId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false
            });
        }

        // Check if job is saved
        if (!user.savedJobs.includes(jobId)) {
            return res.status(400).json({
                message: "Job not saved.",
                success: false
            });
        }

        // Remove job from savedJobs
        user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
        await user.save();

        // Clear cache for saved jobs
        apiCache.clear("/api/v1/user/jobs/saved");

        return res.status(200).json({
            message: "Job removed from saved list.",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Something went wrong.",
            success: false
        });
    }
};

export const getSavedJobs = async (req, res) => {
    try {
        const userId = req.id;
        
        const user = await User.findById(userId).populate({
            path: 'savedJobs',
            populate: {
                path: 'company'
            }
        });
        
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false
            });
        }

        return res.status(200).json({
            savedJobs: user.savedJobs,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Something went wrong.",
            success: false
        });
    }
};

export const deleteResume = async (req, res) => {
    try {
        const userId = req.id;
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng",
                success: false
            });
        }

        // Kiểm tra xem có resume không
        if (!user.profile || !user.profile.resume) {
            return res.status(400).json({
                message: "Không có CV để xóa",
                success: false
            });
        }

        // Lấy URL resume (xử lý cả 2 trường hợp: string hoặc object.url)
        let resumeUrl = '';
        if (typeof user.profile.resume === 'string') {
            resumeUrl = user.profile.resume;
        } else if (user.profile.resume.url) {
            resumeUrl = user.profile.resume.url;
        }

        // Xóa file trên Cloudinary
        if (resumeUrl) {
            try {
                // Trích xuất public_id từ URL
                const urlParts = resumeUrl.split('/');
                // Format Cloudinary: https://res.cloudinary.com/{cloud_name}/{resource_type}/{type}/{public_id}
                if (urlParts.length >= 2) {
                    // Lấy tên file (bao gồm cả folder nếu có)
                    const publicIdWithExt = urlParts.slice(urlParts.indexOf('job_portal')).join('/');
                    // Loại bỏ phần mở rộng file nếu có
                    const publicId = publicIdWithExt.split('.')[0];
                    
                    // Xóa file trên Cloudinary
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
                    console.log(`Đã xóa CV với public_id: ${publicId}`);
                }
            } catch (deleteError) {
                console.error("Không thể xóa CV trên Cloudinary:", deleteError);
                // Không throw lỗi, vẫn tiếp tục xóa thông tin CV từ user
            }
        }

        // Xóa thông tin resume khỏi profile
        user.profile.resume = undefined;
        user.profile.resumeOriginalName = undefined; // Xóa cả tên file gốc nếu có

        await user.save();

        // Trả về thông tin user đã cập nhật
        const userData = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).json({
            message: "Đã xóa CV thành công",
            user: userData,
            success: true
        });
    } catch (error) {
        console.error("Delete resume error:", error);
        return res.status(500).json({
            message: "Không thể xóa CV. Vui lòng thử lại sau.",
            success: false
        });
    }
};