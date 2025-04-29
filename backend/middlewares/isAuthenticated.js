import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        // Lấy token từ cookie
        const token = req.cookies.token;
        
        // Kiểm tra token có tồn tại không
        if (!token) {
            return res.status(401).json({
                message: "Vui lòng đăng nhập để tiếp tục",
                success: false,
                code: "NO_TOKEN"
            });
        }
        
        try {
            // Xác thực token
            const decoded = await jwt.verify(token, process.env.SECRET_KEY);
            
            // Kiểm tra token có userId không
            if (!decoded || !decoded.userId) {
                return res.status(401).json({
                    message: "Token không hợp lệ",
                    success: false,
                    code: "INVALID_TOKEN"
                });
            }
            
            // Gán userId vào request để các middleware và controller tiếp theo có thể truy cập
            req.id = decoded.userId;
            next();
        } catch (jwtError) {
            // Xử lý các loại lỗi JWT cụ thể
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại",
                    success: false,
                    code: "TOKEN_EXPIRED"
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    message: "Token không hợp lệ",
                    success: false,
                    code: "JWT_ERROR"
                });
            } else {
                return res.status(401).json({
                    message: "Xác thực thất bại",
                    success: false,
                    code: "AUTH_FAILED"
                });
            }
        }
    } catch (error) {
        // Xử lý các lỗi không xác định
        console.error("Authentication error:", error);
        return res.status(500).json({
            message: "Lỗi xác thực. Vui lòng thử lại sau",
            success: false,
            code: "SERVER_ERROR"
        });
    }
};

export default isAuthenticated;