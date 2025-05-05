import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { apiCache } from "../utils/redis-cache.js";
import { Notification } from "../models/notification.model.js"; // Import Notification model
import { redisClient } from "../utils/redis-cache.js"; // Import Redis client for refresh tokens

// Helper function to set auth cookies
const setAuthCookies = (res, accessToken, refreshToken = null) => {
    // Determine if we're in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Set access token cookie - short lived (1 hour)
    res.cookie("access_token", accessToken, { 
        maxAge: 60 * 60 * 1000, // 1 hour
        httpOnly: true, 
        secure: false, // Set to false for HTTP
        sameSite: 'lax', // Use 'lax' for better compatibility with HTTP
        path: '/'
    });
    
    // Set refresh token cookie if provided - longer lived (7 days)
    if (refreshToken) {
        res.cookie("refresh_token", refreshToken, { 
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true, 
            secure: false, // Set to false for HTTP
            sameSite: 'lax', // Use 'lax' for better compatibility with HTTP
            path: '/' // Allow access from all paths
        });
    }
};

// Helper function to store refresh token in Redis
const storeRefreshToken = async (userId, refreshToken) => {
    if (redisClient && redisClient.isReady) {
        // Store in Redis with TTL (7 days)
        await redisClient.set(
            `refresh_token:${userId}`, 
            refreshToken,
            { EX: 7 * 24 * 60 * 60 } // 7 days in seconds
        );
        console.log(`Stored refresh token in Redis for user: ${userId}`);
    } else {
        console.warn('Redis client not available for refresh token storage');
    }
};

// Helper function to clear refresh token from Redis
const clearRefreshToken = async (userId) => {
    if (redisClient && redisClient.isReady) {
        await redisClient.del(`refresh_token:${userId}`);
        console.log(`Cleared refresh token from Redis for user: ${userId}`);
    }
};

// Helper function to generate tokens
const generateTokens = async (userId) => {
    // Generate short-lived access token (1 hour)
    const accessToken = await jwt.sign(
        { userId }, 
        process.env.SECRET_KEY, 
        { expiresIn: '1h' }
    );
    
    // Generate longer-lived refresh token (7 days)
    const refreshToken = await jwt.sign(
        { userId, tokenType: 'refresh' }, 
        process.env.REFRESH_TOKEN_SECRET || process.env.SECRET_KEY, 
        { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
};

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
        if (role !== 'user' && role !== 'admin') {
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
                
                // Kiểm tra định dạng file phải là ảnh
                if (!file.mimetype.startsWith('image/')) {
                    return res.status(400).json({
                        message: "CV phải là định dạng hình ảnh (JPEG, PNG, GIF)",
                        success: false,
                    });
                }
                
                // Upload ảnh CV lên Cloudinary
                cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                    folder: "job_portal/resumes",
                    transformation: [
                        { quality: "auto:best" },
                        { format: "jpg" }
                    ]
                });
                
                // Lưu tên file gốc
                cloudResponse.originalName = file.originalname;
                
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
                message: "CV là bắt buộc",
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
                resume: {
                    url: cloudResponse.secure_url,
                    title: 'Resume',
                    originalName: file.originalname
                },
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

        // Trước khi tạo token mới, xóa mọi refresh token cũ của người dùng này
        await clearRefreshToken(user._id);

        // Generate both access and refresh tokens
        const { accessToken, refreshToken } = await generateTokens(user._id);

        // Store refresh token in Redis
        await storeRefreshToken(user._id, refreshToken);

        // Chuẩn bị thông tin người dùng để trả về client (bỏ mật khẩu)
        const userData = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };

        // Set auth cookies and return login success response
        setAuthCookies(res, accessToken, refreshToken);
        
        // Ghi log đăng nhập thành công
        console.log(`User login successful: ${userData.email} (${userData._id}), role: ${userData.role}`);
        
        return res.status(200).json({
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
        // Get user ID from access token to clear refresh token from Redis
        const userId = req.id;
        if (userId) {
            // Clear refresh token from Redis
            await clearRefreshToken(userId);
        }

        // Clear all auth cookies
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        res.clearCookie("token"); // Also clear legacy token for backward compatibility
        
        return res.status(200).json({
            message: "Logged out successfully.",
            success: true
        });
    } catch (error) {
        console.error("Logout error:", error);
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
        if (!user) {
            console.error('No user data in SSO success handler');
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/sso-callback?success=false&error=${encodeURIComponent('Authentication failed: No user data')}`);
        }
        
        console.log('Google SSO authentication successful for user:', user.email);
        
        // Clear any existing tokens for this user before creating new ones
        await clearRefreshToken(user._id);
        
        // Generate both access and refresh tokens
        const { accessToken, refreshToken } = await generateTokens(user._id);
        
        // Store refresh token in Redis
        await storeRefreshToken(user._id, refreshToken);

        // Format user data for response
        const userData = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };

        // Set the tokens in secure cookies
        setAuthCookies(res, accessToken, refreshToken);
        
        // Log successful SSO login
        console.log(`SSO login successful: ${userData.email} (${userData._id}), role: ${userData.role}`);
        
        // Redirect to frontend WITHOUT token in URL params - we're using cookies now
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendURL}/sso-callback?success=true`);
    } catch (error) {
        console.error('SSO auth success error:', error);
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendURL}/sso-callback?success=false&error=${encodeURIComponent(error.message || 'Authentication failed')}`);
    }
};

// SSO Authentication failure handler
export const ssoAuthFailure = (req, res) => {
    console.error('Google SSO authentication failed');
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/sso-callback?success=false&error=${encodeURIComponent('Authentication failed')}`);
};

// Get user profile after SSO login
export const getSsoProfile = async (req, res) => {
    try {
        const userId = req.id; // From isAuthenticated middleware
        console.log('Getting SSO profile for user ID:', userId);
        console.log('Request headers:', req.headers);
        console.log('Auth header:', req.headers.authorization);
        console.log('Cookies:', req.cookies);
        const user = await User.findById(userId);
        if (!user) {
            console.error('User not found for ID:', userId);
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
        
        console.log('SSO profile fetched successfully for:', user.email);
        return res.status(200).json({
            user: userData,
            success: true
        });
    } catch (error) {
        console.error('Get SSO profile error:', error);
        return res.status(500).json({
            message: "Failed to retrieve user profile.",
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

        // Always ensure resume is an object before any operations
        if (!user.profile.resume) {
            // If resume doesn't exist, initialize it as an empty object
            user.profile.resume = {
                url: '',
                title: '',
                originalName: ''
            };
        } else if (typeof user.profile.resume === 'string') {
            // If resume is a string (old format), convert it to object
            user.profile.resume = {
                url: user.profile.resume,
                title: user.profile.resumeTitle || 'Resume',
                originalName: user.profile.resumeOriginalName || ''
            };
            hasChanges = true;
        }

        // Kiểm tra xem có files được upload không
        if (req.files) {
            // Xử lý file resume nếu có
            if (req.files.resume && req.files.resume[0]) {
                hasChanges = true; // File uploads always count as changes
                try {
                    const resumeFile = req.files.resume[0];
                    
                    // Kiểm tra định dạng file là ảnh
                    if (!resumeFile.mimetype.startsWith('image/')) {
                        return res.status(400).json({
                            message: "File CV phải là định dạng hình ảnh (JPEG, PNG, GIF)",
                            success: false
                        });
                    }
                    
                    const fileUri = getDataUri(resumeFile);
                    
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
                                if (urlParts.length >= 2) {
                                    // Lấy tên file (bao gồm cả folder nếu có)
                                    const publicIdWithExt = urlParts.slice(urlParts.indexOf('job_portal')).join('/');
                                    // Loại bỏ phần mở rộng file nếu có
                                    const publicId = publicIdWithExt.split('.')[0];
                                    
                                    console.log(`Xóa CV cũ: ${publicId}`);
                                    // Xóa file cũ trên Cloudinary
                                    await cloudinary.uploader.destroy(publicId);
                                }
                            }
                        } catch (deleteError) {
                            console.error("Không thể xóa CV cũ:", deleteError);
                            // Không throw lỗi, vẫn tiếp tục upload CV mới
                        }
                    }
                    
                    // Upload ảnh CV mới lên Cloudinary
                    resumeCloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                        folder: "job_portal/resumes",
                        transformation: [
                            { quality: "auto:best" },
                            { format: "jpg" }
                        ]
                    });
                    
                    // Lưu tên file gốc để hiển thị
                    resumeCloudResponse.originalName = resumeFile.originalname;
                    
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
                    
                    // Kiểm tra định dạng file là ảnh
                    if (!photoFile.mimetype.startsWith('image/')) {
                        return res.status(400).json({
                            message: "File ảnh đại diện phải là định dạng hình ảnh (JPEG, PNG, GIF)",
                            success: false
                        });
                    }
                    
                    const fileUri = getDataUri(photoFile);
                    
                    // Xóa ảnh đại diện cũ nếu có
                    if (user.profile && user.profile.profilePhoto) {
                        try {
                            const oldPhotoUrl = user.profile.profilePhoto;
                            const urlParts = oldPhotoUrl.split('/');
                            if (urlParts.length >= 2) {
                                const publicIdWithExt = urlParts.slice(urlParts.indexOf('job_portal')).join('/');
                                const publicId = publicIdWithExt.split('.')[0];
                                
                                await cloudinary.uploader.destroy(publicId);
                            }
                        } catch (deleteError) {
                            console.error("Không thể xóa ảnh đại diện cũ:", deleteError);
                        }
                    }
                    
                    // Upload ảnh mới
                    profilePhotoCloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                        folder: "job_portal/profile_photos",
                        transformation: [
                            { width: 400, height: 400, crop: "fill" },
                            { quality: "auto:best" },
                            { format: "jpg" }
                        ]
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
                    
                    // Kiểm tra định dạng file là ảnh
                    if (!file.mimetype.startsWith('image/')) {
                        return res.status(400).json({
                            message: "File phải là định dạng hình ảnh (JPEG, PNG, GIF)",
                            success: false
                        });
                    }
                    
                    const fileUri = getDataUri(file);
                    
                    // Xác định loại file dựa theo tên field
                    const fileCategory = file.fieldname;
                    
                    if (fileCategory === 'resume') {
                        // Upload file như CV
                        resumeCloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                            folder: "job_portal/resumes",
                            transformation: [
                                { quality: "auto:best" },
                                { format: "jpg" }
                            ]
                        });
                        resumeCloudResponse.originalName = file.originalname;
                    } else {
                        // Upload file như ảnh đại diện
                        profilePhotoCloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                            folder: "job_portal/profile_photos",
                            transformation: [
                                { width: 400, height: 400, crop: "fill" },
                                { quality: "auto:best" },
                                { format: "jpg" }
                            ]
                        });
                    }
                } catch (uploadError) {
                    console.error("File upload error:", uploadError);
                }
            }
        }

        let skillsArray = [];
        if (req.body.skills) {
            try {
                // Parse JSON string to array if it's a JSON string
                if (typeof req.body.skills === 'string') {
                    try {
                        if (req.body.skills.startsWith('[')) {
                            skillsArray = JSON.parse(req.body.skills);
                        } else {
                            // Handle as comma-separated string (backward compatibility)
                            skillsArray = req.body.skills.split(",").map(skill => skill.trim());
                        }
                    } catch (jsonError) {
                        console.error("JSON parse error for skills:", jsonError);
                        // Fallback to comma-separated handling if JSON parsing fails
                        skillsArray = req.body.skills.split(",").map(skill => skill.trim());
                    }
                } else if (Array.isArray(req.body.skills)) {
                    // If it's already an array, use it directly
                    skillsArray = req.body.skills;
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
                console.error("Error processing skills:", err);
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
            // Nếu chưa có resume thì khởi tạo object rỗng
            if (!user.profile.resume || typeof user.profile.resume !== 'object') {
                user.profile.resume = {
                    url: '',
                    title: resumeTitle,
                    originalName: ''
                };
                hasChanges = true;
            } else {
                const currentTitle = user.profile.resume.title || '';
                if (resumeTitle !== currentTitle) {
                    user.profile.resume.title = resumeTitle;
                    hasChanges = true;
                }
            }
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
        
        // Explicitly check user ID from auth token
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized access.",
                success: false
            });
        }
        
        const user = await User.findById(userId).populate({
            path: 'savedJobs',
            populate: {
                path: 'company',
                select: 'name logo website location' // Only select needed fields
            }
        });
        
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false
            });
        }

        // Make sure we're returning the user's own saved jobs
        const savedJobs = user.savedJobs || [];
        
        // Add debugging information
        console.log(`Retrieved ${savedJobs.length} saved jobs for user ${userId}`);

        return res.status(200).json({
            savedJobs: savedJobs,
            success: true
        });
    } catch (error) {
        console.error("Get saved jobs error:", error);
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

        // Đảm bảo profile tồn tại
        if (!user.profile) {
            user.profile = {};
        }

        // Đảm bảo resume tồn tại
        if (!user.profile.resume) {
            return res.status(400).json({
                message: "Không có CV để xóa",
                success: false
            });
        }

        // Chuyển đổi resume từ string sang object nếu cần
        if (typeof user.profile.resume === 'string') {
            user.profile.resume = {
                url: user.profile.resume,
                title: user.profile.resumeTitle || 'Resume',
                originalName: user.profile.resumeOriginalName || ''
            };
        }

        // Lấy URL resume - bây giờ đã chắc chắn là object
        const resumeUrl = user.profile.resume.url;

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
                    
                    // Xóa file trên Cloudinary - sử dụng resource_type là 'image' thay vì 'raw'
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`Đã xóa CV với public_id: ${publicId}`);
                }
            } catch (deleteError) {
                console.error("Không thể xóa CV trên Cloudinary:", deleteError);
                // Không throw lỗi, vẫn tiếp tục xóa thông tin CV từ user
            }
        }

        // Xóa thông tin resume khỏi profile
        user.profile.resume = {
            url: '',
            title: '',
            originalName: ''
        };
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

// Get user notifications
export const getNotifications = async (req, res) => {
    try {
        const userId = req.id;
        
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(20);
            
        return res.status(200).json({
            notifications,
            success: true
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({
            message: "Không thể lấy thông báo. Vui lòng thử lại sau.",
            success: false
        });
    }
};

// Mark a notification as read
export const markNotificationRead = async (req, res) => {
    try {
        const userId = req.id;
        const notificationId = req.params.id;
        
        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            return res.status(404).json({
                message: "Không tìm thấy thông báo",
                success: false
            });
        }
        
        // Verify ownership
        if (notification.user.toString() !== userId) {
            return res.status(403).json({
                message: "Bạn không có quyền truy cập thông báo này",
                success: false
            });
        }
        
        notification.read = true;
        await notification.save();
        
        return res.status(200).json({
            message: "Đã đánh dấu thông báo là đã đọc",
            success: true
        });
    } catch (error) {
        console.error("Mark notification read error:", error);
        return res.status(500).json({
            message: "Không thể cập nhật thông báo. Vui lòng thử lại sau.",
            success: false
        });
    }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.id;
        
        // Update all unread notifications for this user
        await Notification.updateMany(
            { user: userId, read: false },
            { read: true }
        );
        
        return res.status(200).json({
            message: "Đã đánh dấu tất cả thông báo là đã đọc",
            success: true
        });
    } catch (error) {
        console.error("Mark all notifications read error:", error);
        return res.status(500).json({
            message: "Không thể cập nhật thông báo. Vui lòng thử lại sau.",
            success: false
        });
    }
};