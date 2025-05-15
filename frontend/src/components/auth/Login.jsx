import React, { useEffect, useState, useRef } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { RadioGroup } from '../ui/radio-group'
import { Button } from '../ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { USER_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useDispatch, useSelector } from 'react-redux'
import { setLoading, setUser } from '@/redux/authSlice'
import { Loader2, Mail, Lock } from 'lucide-react'
import { FaGoogle } from 'react-icons/fa'
import { motion } from 'framer-motion'
import api from '@/utils/api'

const Login = () => {
    const [input, setInput] = useState({
        email: "",
        password: "",
        role: "",
    });
    const { loading, user } = useSelector(store => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const loadingTimeoutRef = useRef(null);
    
    useEffect(() => {
        if (loading) {
            loadingTimeoutRef.current = setTimeout(() => {
                console.log("Login timeout - resetting loading state");
                dispatch(setLoading(false));
                toast.error("Đăng nhập mất nhiều thời gian. Vui lòng thử lại.");
            }, 10000);
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

    const submitHandler = async (e) => {
        e.preventDefault();

        if (!input.email || !input.password || !input.role) {
            return toast.error("Vui lòng điền đầy đủ thông tin");
        }

        try {
            dispatch(setLoading(true));
            
            // Log in using our API utility which sends cookies automatically
            const res = await api.post('/user/login', input);
            
            if (res.data.success) {
                // Just update Redux with user info - token is handled by HTTP-only cookies
                dispatch(setUser(res.data.user));
                toast.success(res.data.message);
                navigate("/");
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Đăng nhập thất bại");
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleGoogleLogin = () => {
        const redirectUrl = `${USER_API_END_POINT}/auth/google`;
        window.location.href = redirectUrl;
    }

    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate])
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-8">
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-primary mb-2">Welcome Back</h1>
                                <p className="text-gray-500">Sign in to continue to Job Portal</p>
                            </div>
                            
                            <form onSubmit={submitHandler}>
                                <div className="mb-6">
                                    <Button 
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg p-2.5 transition-all duration-200 hover:shadow-md"
                                    >
                                        <FaGoogle className="text-red-500 h-5 w-5" />
                                        <span>Sign in with Google</span>
                                    </Button>
                                </div>
                                
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-300"></span>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-4 text-sm text-gray-500">or sign in with email</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
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
                                                    id="role-user"
                                                    name="role"
                                                    value="user"
                                                    checked={input.role === 'user'}
                                                    onChange={changeEventHandler}
                                                    className="cursor-pointer h-4 w-4 text-accent focus:ring-accent"
                                                />
                                                <Label htmlFor="role-user" className="ml-2 cursor-pointer">Job Seeker</Label>
                                            </div>
                                            <div className="flex items-center bg-gray-50 px-4 py-2 rounded-md border border-gray-200 hover:bg-accent/5 transition-colors">
                                                <Input
                                                    type="radio"
                                                    id="role-admin"
                                                    name="role"
                                                    value="admin"
                                                    checked={input.role === 'admin'}
                                                    onChange={changeEventHandler}
                                                    className="cursor-pointer h-4 w-4 text-accent focus:ring-accent"
                                                />
                                                <Label htmlFor="role-admin" className="ml-2 cursor-pointer">Admin</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                                
                                <div className="mt-6">
                                    <Button 
                                        type="submit" 
                                        className="w-full bg-accent hover:bg-accent/90 text-white py-2.5 rounded-lg transition-all duration-200 font-medium"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                                Signing in...
                                            </>
                                        ) : "Sign In"}
                                    </Button>
                                </div>
                            </form>
                            
                            <div className="mt-6 text-center text-sm"> 
                                <span className="text-gray-600">Don't have an account? </span>
                                <Link to="/signup" className="text-accent hover:text-accent/80 font-medium">
                                    Create an account
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default Login