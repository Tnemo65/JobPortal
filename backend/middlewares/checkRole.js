import { User } from "../models/user.model.js";

/**
 * Middleware để xác thực vai trò của người dùng
 * @param {string[]} roles Mảng các vai trò được phép truy cập
 * @returns Middleware function
 */
const checkRole = (roles) => {
    return async (req, res, next) => {
        try {
            const userId = req.id; // Lấy từ middleware isAuthenticated
            
            if (!userId) {
                return res.status(401).json({
                    message: "Vui lòng đăng nhập để tiếp tục",
                    success: false,
                    code: "NOT_AUTHENTICATED"
                });
            }
            
            // Tìm thông tin người dùng
            const user = await User.findById(userId);
            
            // Kiểm tra người dùng có tồn tại không
            if (!user) {
                return res.status(404).json({
                    message: "Không tìm thấy người dùng",
                    success: false,
                    code: "USER_NOT_FOUND"
                });
            }
            
            // Kiểm tra vai trò của người dùng có được phép không
            if (!roles.includes(user.role)) {
                return res.status(403).json({
                    message: "Bạn không có quyền truy cập vào tài nguyên này",
                    success: false,
                    code: "FORBIDDEN_ROLE"
                });
            }
            
            // Thêm thông tin vai trò vào request để sử dụng sau này
            req.userRole = user.role;
            next();
        } catch (error) {
            console.error("Role check error:", error);
            return res.status(500).json({
                message: "Lỗi xác thực vai trò. Vui lòng thử lại sau",
                success: false,
                code: "ROLE_CHECK_ERROR"
            });
        }
    };
};

export default checkRole;