import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { USER_API_END_POINT } from "@/utils/constant";
import { setUser } from "@/redux/authSlice";
import api from '@/utils/api';
import axios from 'axios';

/**
 * Hook kiểm tra trạng thái đăng nhập khi tải trang
 * Đảm bảo người dùng luôn được xác thực khi cookie vẫn còn hiệu lực
 */
const useAuthCheck = () => {
    const [checkingAuth, setCheckingAuth] = useState(true);
    const { user } = useSelector(store => store.auth);
    const dispatch = useDispatch();
    const authCheckAttempted = useRef(false);

    useEffect(() => {
        // Biến để theo dõi nếu component đã unmount
        let isMounted = true;
        
        // Hàm xử lý việc xác thực người dùng
        const verifyAuth = async () => {
            // Avoid calling API multiple times on component re-render
            if (authCheckAttempted.current) return;
            authCheckAttempted.current = true;
            
            try {
                console.log("Verifying authentication status...");
                
                // First, try to refresh token if needed
                try {
                    await axios.post(`${USER_API_END_POINT}/refresh-token`, {}, {
                        withCredentials: true,
                        headers: {
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        }
                    });
                    console.log("Token refresh successful");
                } catch (refreshError) {
                    // Ignore errors - just trying to refresh if possible
                    console.log("Token refresh skipped:", refreshError?.message);
                }
                
                // Add a small delay to ensure token refresh is processed
                await new Promise(resolve => setTimeout(resolve, 300));
                
                try {
                    // Check auth status using HTTP-only cookies
                    console.log("Checking auth status using HTTPS cookies");
                    const res = await api.get(`${USER_API_END_POINT}/sso/profile`, {
                        withCredentials: true, // Critical for HTTP-only cookies
                        headers: {
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache',
                            'X-Request-Protocol': 'https' // Signal HTTPS request
                        }
                    });
                    
                    // Update if component is still mounted and request succeeded
                    if (isMounted && res.data.success) {
                        console.log("User session verified:", res.data.user.email);
                        // Store only user data, no token
                        dispatch(setUser(res.data.user));
                    }
                } catch (error) {
                    // Handle missing/invalid token
                    console.log("No active session found or session invalid");
                    if (error.response) {
                        console.log("Auth status error:", error.response.data?.message || "Unknown error");
                        console.log("Status code:", error.response.status);
                    } else if (error.request) {
                        console.log("No response received:", error.request);
                    } else {
                        console.log("Error during request setup:", error.message);
                    }
                    // User remains null in Redux store
                }
            } catch (error) {
                console.error("Auth verification error:", error.message);
            } finally {
                if (isMounted) {
                    setCheckingAuth(false);
                }
            }
        };

        verifyAuth();

        // Cleanup function to prevent memory leaks
        return () => {
            isMounted = false;
        };
    }, [dispatch]);

    return { checkingAuth };
};

export default useAuthCheck;
