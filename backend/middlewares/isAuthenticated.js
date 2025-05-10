import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        let token;
        
        // Log for debugging cookie issues (simplified)
        console.log(`Auth - Request path: ${req.originalUrl || req.url}`);
        
        // Get token from HTTP-only cookies 
        if (req.cookies && req.cookies.access_token) {
            token = req.cookies.access_token;
            console.log('Auth - Using HTTP-only cookie token');
        }
        
        // Check if token exists
        if (!token) {
            console.log('Auth - No token found in HTTP-only cookies');
            return res.status(401).json({
                message: "Vui lòng đăng nhập để tiếp tục",
                success: false,
                code: "NO_TOKEN"
            });
        }
        
        try {
            // Verify token
            const decoded = await jwt.verify(token, process.env.SECRET_KEY);
            
            if (!decoded || !decoded.userId) {
                return res.status(401).json({
                    message: "Token không hợp lệ",
                    success: false,
                    code: "INVALID_TOKEN"
                });
            }
            
            // Add userId to request for next middlewares/controllers
            req.id = decoded.userId;
            next();
        } catch (jwtError) {
            // Handle specific JWT errors
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
        console.error("Authentication error:", error);
        return res.status(500).json({
            message: "Lỗi xác thực. Vui lòng thử lại sau",
            success: false,
            code: "SERVER_ERROR"
        });
    }
};

export default isAuthenticated;