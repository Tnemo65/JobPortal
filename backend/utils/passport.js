import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:8000/api/v1/user/auth/google/callback',
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });
        
        // If user doesn't exist, create a new one
        if (!user) {
            user = await User.create({
                fullname: profile.displayName,
                email: profile.emails[0].value,
                phoneNumber: '0000000000', // Default phone number
                password: Math.random().toString(36).slice(-8), // Random password
                role: 'student', // Default role
                profile: {
                    profilePhoto: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
                    skills: []
                }
            });
        }
        
        return done(null, user);
    } catch (error) {
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