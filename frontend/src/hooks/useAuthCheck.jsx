import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { USER_API_END_POINT } from "@/utils/constant";
import { setUser } from "@/redux/authSlice";
import axios from 'axios';

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
            // Nếu đã có user trong Redux store thì không cần kiểm tra nữa
            // Chỉ kiểm tra khi refresh trang mà không có user trong Redux
            if (!user) {
                try {
                    // Lấy token từ localStorage
                    const token = localStorage.getItem('token');
                    
                    // Chỉ gửi request nếu có token
                    if (token) {
                        // Gọi API để kiểm tra xác thực từ token
                        const res = await axios.get(`${USER_API_END_POINT}/sso/profile`, {
                            withCredentials: true,
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Cache-Control': 'no-cache',
                                'Pragma': 'no-cache'
                            }
                        });
                        
                        if (res.data.success) {
                            // Cập nhật lại thông tin user vào Redux store
                            dispatch(setUser(res.data.user));
                        }
                    }
                } catch (error) {
                    // Xóa token nếu không hợp lệ
                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                    }
                    console.log("Không có phiên đăng nhập hiện tại");
                }
            }
            setCheckingAuth(false);
        };

        verifyAuth();
    }, []);

    return { checkingAuth };
};

export default useAuthCheck;