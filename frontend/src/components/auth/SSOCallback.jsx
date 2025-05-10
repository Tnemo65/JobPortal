import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { USER_API_END_POINT } from '@/utils/constant';
import { setUser, setLoading } from '@/redux/authSlice';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';

const SSOCallback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const [status, setStatus] = useState('loading');
    const requestTimeoutRef = useRef(null);
    
    useEffect(() => {
        return () => {
            dispatch(setLoading(false));
            if (requestTimeoutRef.current) {
                clearTimeout(requestTimeoutRef.current);
            }
        };
    }, [dispatch]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                dispatch(setLoading(true));
                
                const controller = new AbortController();
                requestTimeoutRef.current = setTimeout(() => controller.abort(), 15000);
                
                if (success === 'true') {
                    // Small delay to ensure cookies are properly set
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Further increased delay for cookie setting
                    
                    // Log cookie status for debugging
                    console.log('Cookies available:', document.cookie ? 'Yes' : 'No');
                    console.log('API endpoint:', `${USER_API_END_POINT}/sso/profile`);
                    console.log('USER_API_END_POINT:', USER_API_END_POINT);
                    console.log('Making profile request to:', `${USER_API_END_POINT}/sso/profile`);
                    console.log('Cookie status:', document.cookie ? 'Cookies present' : 'No cookies');
    
                    // Get user profile using the cookies that were set
                    const res = await axios.get(`${USER_API_END_POINT}/sso/profile`, {
                        withCredentials: true, // Important for cookies
                        signal: controller.signal,
                        headers: {
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        }
                    });
                    
                    clearTimeout(requestTimeoutRef.current);
                    
                    if (res.data.success) {
                        // Store only user data in Redux, not tokens
                        dispatch(setUser(res.data.user));
                        toast.success(`Xin chào ${res.data.user.fullname}`);
                        setStatus('success');
                        
                        // Redirect based on user role
                        setTimeout(() => {
                            if (res.data.user.role === 'admin') {
                                navigate('/admin/companies');
                            } else {
                                navigate('/');
                            }
                        }, 1500);
                    } else {
                        throw new Error('Không thể lấy thông tin người dùng');
                    }
                } else {
                    console.error('SSO authentication error:', error);
                    toast.error(decodeURIComponent(error || 'Đăng nhập thất bại'));
                    setStatus('error');
                    setTimeout(() => navigate('/login'), 3000);
                }
            } catch (err) {
                console.error('SSO callback error:', err);
                
                if (err.name === 'AbortError') {
                    toast.error("Quá thời gian kết nối. Vui lòng thử lại sau.");
                } else {
                    toast.error(err.response?.data?.message || err.message || 'Đăng nhập không thành công');
                    
                    // If unauthorized, could be a CORS or cookie issue
                    if (err.response?.status === 401) {
                        console.error('Authentication failed - cookies may not be properly set');
                        console.log('Cookie settings issue detected');
                    }
                }
                
                setStatus('error');
                setTimeout(() => navigate('/login'), 3000);
            } finally {
                dispatch(setLoading(false));
            }
        };

        fetchUserProfile();
    }, [success, error, dispatch, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                {status === 'loading' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-center mb-2">Đang hoàn tất đăng nhập...</h2>
                        <p className="text-gray-500 text-center">Vui lòng đợi trong giây lát.</p>
                    </>
                )}
                
                {status === 'success' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold text-center mb-2">Đăng nhập thành công!</h2>
                        <p className="text-gray-500 text-center">Đang chuyển hướng đến trang chính...</p>
                    </>
                )}
                
                {status === 'error' && (
                    <>
                        <div className="flex justify-center mb-4">
                            <AlertCircle className="h-12 w-12 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-center mb-2">Đăng nhập thất bại</h2>
                        <p className="text-gray-500 text-center mb-4">
                            {error ? decodeURIComponent(error) : 'Có lỗi xảy ra khi đăng nhập.'}
                        </p>
                        <p className="text-gray-500 text-center">
                            Bạn sẽ được chuyển hướng về trang đăng nhập.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default SSOCallback;