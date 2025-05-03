import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

// Xác định callback URL đầy đủ để khớp với authorized redirect URIs trong Google Cloud Console
const baseURL = process.env.BASE_URL || 'http://localhost:8080';
const callbackURL = `${baseURL}/api/v1/user/auth/google/callback`;

console.log('Using Google OAuth callback URL:', callbackURL);
console.log('Google OAuth environment:', {
  clientIDExists: !!process.env.GOOGLE_CLIENT_ID,
  clientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
  baseURL: process.env.BASE_URL || 'http://localhost:8080',
  frontendURL: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV
});

// Kiểm tra các biến môi trường cần thiết
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET chưa được cấu hình trong .env');
    console.error('OAuth sẽ không hoạt động đúng nếu thiếu các biến này');
}

// Cấu hình Google OAuth strategy với xử lý lỗi và logs
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL,
    scope: ['profile', 'email'],
    prompt: 'select_account', // Luôn hiển thị màn hình chọn tài khoản
    proxy: true, // Hỗ trợ cho cấu hình proxy nếu cần
    // Tắt việc tự động chuyển đổi chuỗi tham số trong URL
    passReqToCallback: true, // Sẽ truyền req object vào callback
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google OAuth callback invoked with profile:', {
            id: profile.id,
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value,
            hasPhotos: !!profile.photos?.length,
            provider: profile.provider
        });
        
        // Kiểm tra dữ liệu profile hợp lệ
        if (!profile || !profile.emails || !profile.emails[0] || !profile.emails[0].value) {
            console.error('Profile data invalid:', JSON.stringify(profile));
            return done(new Error('Invalid profile data from Google'));
        }

        // Tìm user theo email
        let user = await User.findOne({ email: profile.emails[0].value });
        
        // Nếu user không tồn tại, tạo mới
        if (!user) {
            console.log('Creating new user from Google profile:', profile.displayName);
            
            try {
                user = await User.create({
                    fullname: profile.displayName || 'Google User',
                    email: profile.emails[0].value,
                    phoneNumber: '0000000000', // Số điện thoại mặc định
                    password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Mật khẩu ngẫu nhiên
                    role: 'student', // Vai trò mặc định
                    profile: {
                        profilePhoto: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
                        skills: []
                    }
                });
                console.log('New user created successfully:', user.email);
            } catch (createError) {
                console.error('Failed to create new user:', createError);
                return done(new Error('Failed to create new user: ' + createError.message));
            }
        } else {
            console.log('User already exists:', user.email);
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