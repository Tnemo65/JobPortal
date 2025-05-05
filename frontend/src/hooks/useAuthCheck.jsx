import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { USER_API_END_POINT } from "@/utils/constant";
import { setUser } from "@/redux/authSlice";
import axios from 'axios';
import api from '@/utils/api';

/**
 * Hook kiểm tra trạng thái đăng nhập khi tải trang
 * Đảm bảo người dùng luôn được xác thực khi cookie vẫn còn hiệu lực
 */
const useAuthCheck = () => {
    const [checkingAuth, setCheckingAuth] = useState(true);
    const { user } = useSelector(store => store.auth);
    const dispatch = useDispatch();

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                // Kiểm tra xem có cookie refresh token không trước khi gọi refresh
                const hasCookies = document.cookie.includes('refresh_token') || 
                                   document.cookie.includes('access_token');
                
                // Chỉ refresh token khi có cookies hoặc user trong Redux store
                if (user || hasCookies) {
                    try {
                        await api.post(`/user/refresh-token`, {}, {
                            withCredentials: true
                        }).catch((err) => {
                            // Nếu lỗi 401, có thể session đã hết hạn - bỏ qua
                            if (err.response && err.response.status === 401) {
                                console.log("Refresh token expired or invalid");
                            }
                        });
                    } catch (error) {
                        // Bỏ qua lỗi refresh token - sẽ kiểm tra sau
                    }
                }
                
                // Nếu chưa có user trong Redux store, thử lấy thông tin
                if (!user) {
                    try {
                        // Gọi API để xác thực trạng thái đăng nhập sử dụng HTTP-only cookies
                        const res = await api.get(`/user/sso/profile`, {
                            withCredentials: true,
                            headers: {
                                'Cache-Control': 'no-cache',
                                'Pragma': 'no-cache'
                            }
                        });
                        
                        if (res.data.success) {
                            // Cập nhật thông tin người dùng trong Redux store
                            dispatch(setUser(res.data.user));
                        }
                    } catch (error) {
                        if (error.response && error.response.status === 401) {
                            console.log("No active session found");
                        } else {
                            console.error("Error fetching user profile:", error);
                        }
                        // Không cần thiết phải làm gì - user vẫn là null
                    }
                }
            } catch (error) {
                console.error("Auth verification error:", error);
            } finally {
                setCheckingAuth(false);
            }
        };

        verifyAuth();
    }, [user, dispatch]);

    return { checkingAuth };
};

export default useAuthCheck;