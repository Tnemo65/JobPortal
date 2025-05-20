import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';
import dotenv from 'dotenv';
import bcrypt from "bcryptjs";

dotenv.config();

// Xác định callback URL đầy đủ để khớp với authorized redirect URIs trong Google Cloud Console
const callbackURL = process.env.OAUTH_CALLBACK_URL || 'https://jobmarket.fun/api/v1/user/auth/google/callback';

console.log('Using Google OAuth callback URL:', callbackURL);

// Kiểm tra các biến môi trường cần thiết
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET chưa được cấu hình trong .env');
    console.error('OAuth sẽ không hoạt động đúng nếu thiếu các biến này');
}

// Cấu hình Google OAuth strategy với xử lý lỗi và logs nâng cao
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL,
    scope: ['profile', 'email'],
    prompt: 'select_account', // Luôn hiển thị màn hình chọn tài khoản
    proxy: true, // Hỗ trợ cho cấu hình proxy nếu cần
    passReqToCallback: true, // Sẽ truyền req object vào callback
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    state: true // Enable state parameter for CSRF protection
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        // Tạo requestId để theo dõi quá trình xử lý
        const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(2, 15);
        console.log(`[${requestId}] Processing Google OAuth profile:`, profile.displayName, profile.emails?.[0]?.value);
        
        // Kiểm tra dữ liệu profile hợp lệ
        if (!profile || !profile.emails || !profile.emails[0] || !profile.emails[0].value) {
            console.error(`[${requestId}] Profile data invalid:`, profile);
            return done(new Error('Invalid profile data from Google'));
        }

        // Tìm user theo email
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });
        
        // Nếu user không tồn tại, tạo mới
        if (!user) {
            console.log(`[${requestId}] Creating new user from Google profile:`, profile.displayName);
            // Tạo mật khẩu ngẫu nhiên bảo mật
            const randomPass = Math.random().toString(36).slice(-10) + 
                             Math.random().toString(36).slice(-10) + 
                             Math.random().toString(36).slice(-10);
            
            try {
                // Hash mật khẩu trước khi lưu vào DB
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(randomPass, salt);
                
                user = await User.create({
                    fullname: profile.displayName || 'Google User',
                    email: email,
                    phoneNumber: '0000000000', // Số điện thoại mặc định
                    password: hashedPassword, // Mật khẩu đã được hash
                    role: 'user', // Vai trò mặc định
                    profile: {
                        profilePhoto: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
                        skills: [],
                        bio: 'Tài khoản được tạo thông qua đăng nhập Google'
                    },
                    authMethod: 'google' // Đánh dấu tài khoản được tạo thông qua Google
                });
            } catch (createError) {
                console.error(`[${requestId}] Error creating new user:`, createError);
                
                // Kiểm tra lỗi trùng lặp email
                if (createError.code === 11000) {
                    console.log(`[${requestId}] Duplicate email error, trying to find user again`);
                    
                    // Thử tìm user một lần nữa (có thể có race condition)
                    user = await User.findOne({ email });
                    if (user) {
                        console.log(`[${requestId}] User found on second attempt:`, user.email);
                    } else {
                        return done(new Error('Không thể tạo tài khoản mới. Email đã tồn tại nhưng không thể truy xuất.'));
                    }
                } else {
                    return done(createError);
                }
            }
        } else {
            console.log(`[${requestId}] User already exists:`, user.email);
            
            // Có thể cập nhật thông tin hồ sơ từ Google nếu cần
            let needsUpdate = false;
            
            // Cập nhật ảnh đại diện nếu chưa có hoặc đã thay đổi
            if (profile.photos && profile.photos.length > 0) {
                if (!user.profile) user.profile = {};
                
                const googlePhotoUrl = profile.photos[0].value;
                if (!user.profile.profilePhoto || user.profile.profilePhoto !== googlePhotoUrl) {
                    user.profile.profilePhoto = googlePhotoUrl;
                    needsUpdate = true;
                }
            }
            
            // Cập nhật tên hiển thị nếu có sự thay đổi
            if (profile.displayName && user.fullname !== profile.displayName) {
                // Xem xét có nên cập nhật tên người dùng không
                // user.fullname = profile.displayName;
                // needsUpdate = true;
            }
            
            // Lưu cập nhật nếu cần
            if (needsUpdate) {
                try {
                    await user.save();
                    console.log(`[${requestId}] Updated user profile from Google data:`, user.email);
                } catch (updateError) {
                    console.error(`[${requestId}] Error updating user profile:`, updateError);
                    // Không cần dừng luồng xử lý, vẫn tiếp tục đăng nhập
                }
            }
        }
        
        return done(null, user);
    } catch (error) {
        console.error('Error in Google auth strategy:', error);
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

export default passport;