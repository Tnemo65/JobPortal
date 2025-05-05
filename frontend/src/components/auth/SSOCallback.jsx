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
    const token = searchParams.get('token'); // Lấy token từ URL nếu có
    const [status, setStatus] = useState('loading'); // loading, success, error
    const requestTimeoutRef = useRef(null);
    
    useEffect(() => {
        // Đảm bảo loading state được reset nếu component unmount
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
                // Reset loading state
                dispatch(setLoading(true));
                
                // Thiết lập timeout
                const controller = new AbortController();
                requestTimeoutRef.current = setTimeout(() => controller.abort(), 15000);
                
                if (success === 'true') {
                    // Sử dụng token từ URL nếu có
                    if (token) {
                        localStorage.setItem('token', token);
                        console.log('Token saved from URL params:', token.substring(0, 10) + '...');
                    }
                    
                    // Gọi API để lấy thông tin người dùng
                    const res = await axios.get(`${USER_API_END_POINT}/sso/profile`, {
                        withCredentials: true,
                        // signal: controller.signal
                        headers: {
                            Authorization: `Bearer ${token || localStorage.getItem('token')}`
                        }
                    });
                    
                    clearTimeout(requestTimeoutRef.current);
                    
                    if (res.data.success) {
                        dispatch(setUser(res.data.user));
                        toast.success(`Xin chào ${res.data.user.fullname}`);
                        setStatus('success');
                        
                        // Redirect based on user role
                        setTimeout(() => {
                            if (res.data.user.role === 'recruiter') {
                                navigate('/admin/companies');
                            } else {
                                navigate('/');
                            }
                        }, 1500); // Short delay to show success state
                    } else {
                        throw new Error('Không thể lấy thông tin người dùng');
                    }
                } else {
                    // Handle authentication error
                    console.error('SSO authentication error:', error);
                    toast.error(decodeURIComponent(error || 'Đăng nhập thất bại'));
                    setStatus('error');
                    setTimeout(() => navigate('/login'), 3000);
                }
            } catch (err) {
                console.error('SSO callback error:', err);
                // Xóa token nếu không hợp lệ
                localStorage.removeItem('token');
                
                if (err.name === 'AbortError') {
                    toast.error("Quá thời gian kết nối. Vui lòng thử lại sau.");
                } else {
                    toast.error(err.response?.data?.message || err.message || 'Đăng nhập không thành công');
                }
                
                setStatus('error');
                setTimeout(() => navigate('/login'), 3000);
            } finally {
                // Đảm bảo loading state được reset
                dispatch(setLoading(false));
            }
        };

        fetchUserProfile();
    }, [success, error, token, dispatch, navigate]);

    // Component UI không thay đổi...
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