import mongoose from "mongoose";
import { encryptData, decryptData } from "../utils/encryption.js";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String, 
    },
    password:{
        type:String,
        required:true,
    },
    role:{
        type:String,
        enum:['student','recruiter'],
        required:true
    },
    profile:{
        bio:{type:String},
        skills:[{type:String}],
        resume: {
            url: { type: String },
            title: { type: String },
            originalName: { type: String }  // Added explicitly here to match controller usage
        },
        resumeOriginalName:{type:String},  // Legacy field maintained for backwards compatibility
        company:{type:mongoose.Schema.Types.ObjectId, ref:'Company'}, 
        profilePhoto:{
            type:String,
            default:""
        },
        githubUsername: {
            type: String
        },
        linkedinUsername: {
            type: String
        },
        facebookUsername: {
            type: String
        }
    },
    savedJobs:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }],
    appliedJobs:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }],
},{
    timestamps:true,
    // Bật tính năng getters để truy xuất dữ liệu đã được giải mã
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Middleware tiền xử lý trước khi trả về dữ liệu người dùng
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    
    // Ẩn mật khẩu khi trả về dữ liệu cho client
    delete userObject.password;
    
    return userObject;
};

export const User = mongoose.model('User', userSchema);