# Job Portal Application

Ứng dụng tuyển dụng được xây dựng với MERN Stack (MongoDB, Express.js, React.js, Node.js).

## Tính năng bảo mật chính

### 1. Bảo vệ CSRF (Cross-Site Request Forgery)
- Sử dụng middleware CSRF protection để bảo vệ khỏi các cuộc tấn công CSRF
- API endpoint `/api/csrf-token` để cung cấp CSRF token cho client
- Tự động thêm CSRF token vào mọi request thông qua utility `csrf.js`

### 2. HTTP Security Headers
- Helmet.js để thiết lập các HTTP headers bảo mật
- Content Security Policy (CSP) để hạn chế nguồn tài nguyên
- X-Frame-Options để ngăn clickjacking
- Strict-Transport-Security (HSTS) để yêu cầu HTTPS
- X-XSS-Protection và X-Content-Type-Options để bảo vệ khỏi XSS và MIME-sniffing

### 3. Rate Limiting
- Giới hạn số lượng request từ một IP trong khoảng thời gian nhất định
- `basicLimiter` cho tất cả các routes
- `apiLimiter` cho các API endpoints quan trọng

### 4. Authentication và Authorization
- JWT authentication với cookie httpOnly
- Middleware `isAuthenticated` để bảo vệ các routes yêu cầu đăng nhập
- Role-based access control với middleware `checkRole`
- Kiểm tra quyền sở hữu tài nguyên với middleware `checkOwnership`

### 5. Bảo mật dữ liệu
- Mã hóa mật khẩu với bcrypt
- Xác thực đầu vào chặt chẽ
- Middleware `strongPassword` để đảm bảo mật khẩu mạnh
- Xử lý lỗi chi tiết và phản hồi an toàn

## Cách triển khai CSRF protection

### Backend
```javascript
// Thêm CSRF middleware vào Express app
import csrfProtection, { csrfErrorHandler } from "./middlewares/csrf-protection.js";

// CSRF Protection - loại trừ một số routes như SSO
const csrfExcludedRoutes = ['/api/v1/user/auth/google', '/api/v1/user/auth/google/callback'];
app.use((req, res, next) => {
    if (csrfExcludedRoutes.includes(req.path)) {
        next();
    } else {
        csrfProtection(req, res, next);
    }
});
app.use(csrfErrorHandler);

// Cung cấp CSRF token cho client
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
```

### Frontend
```javascript
// utils/csrf.js
import axios from 'axios';

let csrfToken = null;

// Lấy CSRF token từ server
export const fetchCsrfToken = async () => {
    try {
        const response = await axios.get('/api/csrf-token', { withCredentials: true });
        csrfToken = response.data.csrfToken;
        return csrfToken;
    } catch (error) {
        console.error('Không thể lấy CSRF token:', error);
        throw error;
    }
};

// Tạo axios instance với CSRF token
export const createSecureAxios = async () => {
    if (!csrfToken) {
        await fetchCsrfToken();
    }
    
    const secureAxios = axios.create({
        withCredentials: true,
        headers: {
            'CSRF-Token': csrfToken
        }
    });
    
    return secureAxios;
};
```

## Triển khai ứng dụng

### Backend
1. Di chuyển vào thư mục backend:
   ```
   cd backend
   ```

2. Cài đặt dependencies:
   ```
   npm install
   ```

3. Tạo file .env với các biến môi trường cần thiết:
   ```
   MONGO_URI=your_mongodb_connection_string
   SECRET_KEY=your_jwt_secret_key
   SECRET_ENCRYPTION_KEY=your_encryption_key
   CLOUD_NAME=your_cloudinary_cloud_name
   API_KEY=your_cloudinary_api_key
   API_SECRET=your_cloudinary_api_secret
   PORT=8000
   ```

4. Khởi động server:
   ```
   npm start
   ```

### Frontend
1. Di chuyển vào thư mục frontend:
   ```
   cd frontend
   ```

2. Cài đặt dependencies:
   ```
   npm install
   ```

3. Khởi động ứng dụng:
   ```
   npm run dev
   ```

## Lưu ý bảo mật
1. Luôn sử dụng HTTPS trong môi trường production
2. Cập nhật các dependencies thường xuyên để vá các lỗ hổng bảo mật
3. Không lưu trữ SECRET_KEY và các thông tin nhạy cảm khác trong mã nguồn
4. Sử dụng các công cụ kiểm tra bảo mật như OWASP ZAP hoặc Snyk để kiểm tra các lỗ hổng