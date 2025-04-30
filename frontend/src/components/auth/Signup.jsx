import React, { useEffect, useState, useRef } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { RadioGroup } from '../ui/radio-group'
import { Button } from '../ui/button'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useDispatch, useSelector } from 'react-redux'
import { setLoading } from '@/redux/authSlice'
import { Loader2, Mail, Lock, User, Phone, Upload } from 'lucide-react'
import { motion } from 'framer-motion'

const Signup = () => {
    const [input, setInput] = useState({
        fullname: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "",
        file: ""
    });
    const {loading, user} = useSelector(store => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [fileName, setFileName] = useState("");
    const loadingTimeoutRef = useRef(null);
    
    // Thêm timeout để reset trạng thái loading nếu kéo dài quá lâu
    useEffect(() => {
        if (loading) {
            loadingTimeoutRef.current = setTimeout(() => {
                console.log("Signup timeout - resetting loading state");
                dispatch(setLoading(false));
                toast.error("Đăng ký mất nhiều thời gian. Vui lòng thử lại sau.");
            }, 15000); // 15 giây timeout
        } else {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
        }
        
        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        };
    }, [loading, dispatch]);

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    }
    
    const changeFileHandler = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Kiểm tra định dạng file là ảnh
            const validFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
            if (!validFormats.includes(file.type)) {
                toast.error('CV phải là định dạng hình ảnh (JPEG, PNG, GIF)');
                e.target.value = '';
                return;
            }
            
            // Kiểm tra kích thước file (tối đa 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                toast.error('File quá lớn. Kích thước tối đa cho phép là 5MB');
                e.target.value = '';
                return;
            }
            
            setFileName(file.name);
            setInput({ ...input, file });
        }
    }
    
    const submitHandler = async (e) => {
        e.preventDefault();
        
        // Kiểm tra dữ liệu trước khi submit
        if (!input.fullname || !input.email || !input.phoneNumber || !input.password || !input.role) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return;
        }
        
        if (!input.file && input.role === 'student') {
            toast.error("Vui lòng tải lên CV của bạn");
            return;
        }
        
        const formData = new FormData();
        formData.append("fullname", input.fullname);
        formData.append("email", input.email);
        formData.append("phoneNumber", input.phoneNumber);
        formData.append("password", input.password);
        formData.append("role", input.role);
        if (input.file) {
            formData.append("file", input.file);
        }

        try {
            // Reset loading state và đặt lại
            dispatch(setLoading(false));
            dispatch(setLoading(true));
            
            // Đặt timeout cho request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 giây
            
            const res = await axios.post(`${USER_API_END_POINT}/register`, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (res.data.success) {
                navigate("/login");
                toast.success(res.data.message);
            }
        } catch (error) {
            console.error("Registration error:", error);
            if (error.name === 'AbortError') {
                toast.error("Đăng ký quá thời gian. Vui lòng thử lại.");
            } else {
                toast.error(error.response?.data?.message || "Đăng ký thất bại");
            }
        } finally {
            dispatch(setLoading(false));
        }
    }

    useEffect(() => {
        if(user) {
            navigate("/");
        }
    }, [user, navigate])
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-lg"
                >
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-8">
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-primary mb-2">Create an Account</h1>
                                <p className="text-gray-500">Join Job Portal to find your dream job</p>
                            </div>
                            
                            <form onSubmit={submitHandler} className="space-y-5">
                                <div>
                                    <Label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">Full Name</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="fullname"
                                            type="text"
                                            name="fullname"
                                            value={input.fullname}
                                            onChange={changeEventHandler}
                                            placeholder="John Doe"
                                            className="pl-10 bg-gray-50 border-gray-300 focus:border-accent focus:ring-accent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={input.email}
                                            onChange={changeEventHandler}
                                            placeholder="name@example.com"
                                            className="pl-10 bg-gray-50 border-gray-300 focus:border-accent focus:ring-accent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Phone className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="phoneNumber"
                                            type="text"
                                            name="phoneNumber"
                                            value={input.phoneNumber}
                                            onChange={changeEventHandler}
                                            placeholder="123-456-7890"
                                            className="pl-10 bg-gray-50 border-gray-300 focus:border-accent focus:ring-accent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={input.password}
                                            onChange={changeEventHandler}
                                            placeholder="••••••••"
                                            className="pl-10 bg-gray-50 border-gray-300 focus:border-accent focus:ring-accent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 mb-2">I am a:</Label>
                                    <RadioGroup className="flex flex-col sm:flex-row gap-3 mt-1">
                                        <div className="flex items-center bg-gray-50 px-4 py-2 rounded-md border border-gray-200 hover:bg-accent/5 transition-colors">
                                            <Input
                                                type="radio"
                                                id="role-student"
                                                name="role"
                                                value="student"
                                                checked={input.role === 'student'}
                                                onChange={changeEventHandler}
                                                className="cursor-pointer h-4 w-4 text-accent focus:ring-accent"
                                            />
                                            <Label htmlFor="role-student" className="ml-2 cursor-pointer">Job Seeker</Label>
                                        </div>
                                        <div className="flex items-center bg-gray-50 px-4 py-2 rounded-md border border-gray-200 hover:bg-accent/5 transition-colors">
                                            <Input
                                                type="radio"
                                                id="role-recruiter"
                                                name="role"
                                                value="recruiter"
                                                checked={input.role === 'recruiter'}
                                                onChange={changeEventHandler}
                                                className="cursor-pointer h-4 w-4 text-accent focus:ring-accent"
                                            />
                                            <Label htmlFor="role-recruiter" className="ml-2 cursor-pointer">Recruiter</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div>
                                    <Label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">CV / Resume (Hình ảnh)</Label>
                                    <div className="relative">
                                        <label htmlFor="file" className="flex items-center gap-2 cursor-pointer w-full p-2 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
                                            <div className="bg-accent/10 rounded-full p-2">
                                                <Upload className="h-5 w-5 text-accent" />
                                            </div>
                                            <span className="text-gray-500 text-sm">
                                                {fileName ? fileName : "Tải lên CV (định dạng ảnh)"}
                                            </span>
                                        </label>
                                        <Input
                                            id="file"
                                            type="file"
                                            accept="image/*"
                                            onChange={changeFileHandler}
                                            className="hidden"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Định dạng ảnh: JPEG, PNG, GIF (tối đa 5MB)</p>
                                </div>
                                
                                <div className="pt-2">
                                    <Button 
                                        type="submit" 
                                        className="w-full bg-accent hover:bg-accent/90 text-white py-2.5 rounded-lg transition-all duration-200 font-medium"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                                Creating Account...
                                            </>
                                        ) : "Create Account"}
                                    </Button>
                                </div>
                            </form>
                            
                            <div className="mt-6 text-center text-sm">
                                <span className="text-gray-600">Already have an account? </span>
                                <Link to="/login" className="text-accent hover:text-accent/80 font-medium">
                                    Sign in
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default Signup