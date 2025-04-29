/**
 * Middleware kiểm tra độ mạnh của mật khẩu
 * Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
 */
const strongPassword = (req, res, next) => {
    try {
        const { password } = req.body;
        
        // Nếu không có mật khẩu hoặc đang cập nhật không có mật khẩu, bỏ qua
        if (!password) {
            return next();
        }
        
        // Kiểm tra độ dài mật khẩu
        if (password.length < 8) {
            return res.status(400).json({
                message: "Mật khẩu phải có ít nhất 8 ký tự",
                success: false,
                code: "PASSWORD_TOO_SHORT"
            });
        }
        
        // Kiểm tra mật khẩu có chữ hoa
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({
                message: "Mật khẩu phải có ít nhất một chữ hoa",
                success: false,
                code: "PASSWORD_NO_UPPERCASE"
            });
        }
        
        // Kiểm tra mật khẩu có chữ thường
        if (!/[a-z]/.test(password)) {
            return res.status(400).json({
                message: "Mật khẩu phải có ít nhất một chữ thường",
                success: false,
                code: "PASSWORD_NO_LOWERCASE"
            });
        }
        
        // Kiểm tra mật khẩu có số
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({
                message: "Mật khẩu phải có ít nhất một chữ số",
                success: false,
                code: "PASSWORD_NO_NUMBER"
            });
        }
        
        // Kiểm tra mật khẩu có ký tự đặc biệt
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return res.status(400).json({
                message: "Mật khẩu phải có ít nhất một ký tự đặc biệt (!@#$%^&*()_+...)",
                success: false,
                code: "PASSWORD_NO_SPECIAL_CHAR"
            });
        }
        
        // Kiểm tra mật khẩu có bao gồm thông tin cá nhân không (email, tên,...)
        const { email, fullname } = req.body;
        if (email && password.toLowerCase().includes(email.toLowerCase().split('@')[0])) {
            return res.status(400).json({
                message: "Mật khẩu không được chứa email của bạn",
                success: false,
                code: "PASSWORD_CONTAINS_EMAIL"
            });
        }
        
        if (fullname && fullname.split(' ').some(namePart => 
            namePart.length > 2 && password.toLowerCase().includes(namePart.toLowerCase())
        )) {
            return res.status(400).json({
                message: "Mật khẩu không được chứa tên của bạn",
                success: false,
                code: "PASSWORD_CONTAINS_NAME"
            });
        }
        
        // Mật khẩu đạt yêu cầu
        next();
    } catch (error) {
        console.error("Password validation error:", error);
        return res.status(500).json({
            message: "Lỗi khi xác thực mật khẩu",
            success: false
        });
    }
};

export default strongPassword;