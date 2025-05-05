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
        const clearSession = async () => {
            // We don't need to manually clear any localStorage tokens anymore
            // The backend will handle clearing HTTP-only cookies
            dispatch(setUser(null));
        };

        const verifyAuth = async () => {
            try {
                // First, try to refresh the token if needed
                await axios.post(`${USER_API_END_POINT}/refresh-token`, {}, {
                    withCredentials: true
                }).catch(() => {
                    // Ignore errors - just trying to refresh if possible
                });
                
                // Only check auth if we don't already have a user in Redux store
                if (!user) {
                    try {
                        // Call the API to verify auth status using HTTP-only cookies
                        const res = await api.get(`/user/sso/profile`, {
                            withCredentials: true,
                            headers: {
                                'Cache-Control': 'no-cache',
                                'Pragma': 'no-cache'
                            }
                        });
                        
                        if (res.data.success) {
                            // Update user info in Redux store
                            dispatch(setUser(res.data.user));
                        }
                    } catch (error) {
                        console.log("No active session found");
                        // No action needed - user remains null
                    }
                }
            } catch (error) {
                console.error("Auth verification error:", error);
            } finally {
                setCheckingAuth(false);
            }
        };

        verifyAuth();
    }, []);

    return { checkingAuth };
};

export default useAuthCheck;