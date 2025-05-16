import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { USER_API_END_POINT } from "@/utils/constant";
import { setUser } from "@/redux/authSlice";
import { get } from '@/utils/api';

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
                
                // Add a small delay to ensure component is fully mounted
                await new Promise(resolve => setTimeout(resolve, 50));
                  try {
                    // Check auth status using HTTP-only cookies
                    const res = await get(`${USER_API_END_POINT}/sso/profile`, {
                        withCredentials: true, // Critical for HTTP-only cookies
                        bypassCache: true, // Ensure no caching
                        critical: true // Mark as critical request
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
