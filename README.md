# JobPortal - Nền tảng tìm việc làm trực tuyến

![Job Portal Banner](https://via.placeholder.com/1200x300/48A6A7/FFFFFF?text=JobPortal)

## 📚 Giới thiệu

JobPortal là nền tảng tìm việc làm toàn diện được phát triển bằng MERN Stack (MongoDB, Express, React, Node.js), giúp kết nối ứng viên tìm việc và nhà tuyển dụng một cách hiệu quả. Với giao diện thân thiện và tính năng đa dạng, JobPortal là giải pháp lý tưởng cho những người đang tìm kiếm cơ hội nghề nghiệp mới và các công ty đang cần tuyển dụng nhân sự.

## 🌟 Tính năng chính

### 🔍 Dành cho người tìm việc
- **Tạo hồ sơ cá nhân**: Ứng viên có thể tạo hồ sơ với thông tin chi tiết về bản thân, kỹ năng và kinh nghiệm
- **Tìm kiếm công việc**: Tìm kiếm công việc phù hợp với nhiều bộ lọc (vị trí, loại công việc, mức lương...)
- **Lưu công việc yêu thích**: Đánh dấu và theo dõi các cơ hội việc làm ưng ý
- **Ứng tuyển trực tuyến**: Nộp đơn ứng tuyển trực tiếp qua nền tảng với CV đã tải lên
- **Theo dõi đơn ứng tuyển**: Xem được trạng thái các đơn đã nộp
- **Đăng nhập bằng tài khoản Google**: Đơn giản hóa quá trình đăng nhập/đăng ký

### 💼 Dành cho nhà tuyển dụng
- **Quản lý công ty**: Tạo và quản lý thông tin công ty
- **Đăng tin tuyển dụng**: Đăng tải các vị trí cần tuyển dụng với thông tin chi tiết
- **Quản lý ứng viên**: Xem xét, chấp nhận hoặc từ chối đơn ứng tuyển
- **Bảng điều khiển**: Giao diện quản trị trực quan cho việc theo dõi tin tuyển dụng

## 🛠️ Công nghệ sử dụng

### Frontend
- **React**: Thư viện JavaScript để xây dựng giao diện người dùng
- **Redux Toolkit**: Quản lý state của ứng dụng
- **TailwindCSS**: Framework CSS cho thiết kế responsive
- **Framer Motion**: Thư viện animation cho React
- **Axios**: Thực hiện các HTTP request
- **React Router**: Định tuyến trong ứng dụng
- **Redux Persist**: Lưu trữ state vào local storage
- **shadcn/ui**: Hệ thống UI component chất lượng cao và có thể tùy chỉnh
- **Sonner**: Hiển thị thông báo toast đẹp mắt

### Backend
- **Node.js**: Môi trường runtime JavaScript phía server
- **Express**: Framework web cho Node.js
- **MongoDB**: Cơ sở dữ liệu NoSQL
- **Mongoose**: ODM (Object Data Modeling) cho MongoDB
- **JWT**: Xác thực và ủy quyền người dùng
- **Bcrypt**: Mã hóa mật khẩu
- **Multer**: Xử lý upload file
- **Cloudinary**: Lưu trữ hình ảnh và file
- **Redis**: Cache và quản lý phiên làm việc
- **Passport.js**: Xác thực với các dịch vụ của bên thứ ba (Google, Facebook)
- **Express Rate Limit**: Giới hạn request để ngăn chặn tấn công

## 📋 Yêu cầu hệ thống

- Node.js phiên bản 18 trở lên
- MongoDB 5.0 trở lên
- Redis 6.0 trở lên (cho cache và quản lý phiên)
- Tài khoản Cloudinary (cho việc lưu trữ hình ảnh và file)
- Kết nối Internet ổn định

## 🚀 Hướng dẫn cài đặt

### 1. Clone repository

```bash
git clone https://github.com/your-username/jobportal-yt-main.git
cd jobportal-yt-main
```

### 2. Cài đặt dependencies cho Backend

```bash
cd backend
npm install
```

### 3. Thiết lập tệp .env cho Backend

Tạo một file `.env` trong thư mục `backend` với nội dung:

```env
MONGODB_URI=mongodb://localhost:27017/jobportal
PORT=8000
JWT_SECRET=your_jwt_secret_key
REDIS_URL=redis://localhost:6379
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:5173
```

### 4. Cài đặt dependencies cho Frontend

```bash
cd ../frontend
npm install
```

### 5. Thiết lập tệp .env cho Frontend

Tạo một file `.env` trong thư mục `frontend` với nội dung:

```env
VITE_API_URL=http://localhost:8000/api
```

### 6. Khởi chạy ứng dụng

#### Backend:

```bash
cd backend
npm run dev
```

#### Frontend:

```bash
cd frontend
npm run dev
```

Sau khi khởi chạy, Frontend sẽ chạy tại địa chỉ `http://localhost:5173`, và Backend sẽ chạy tại `http://localhost:8000`.

## 🧩 Cấu trúc dự án

### Backend
```
backend/
├── controllers/         # Xử lý logic nghiệp vụ
├── middlewares/         # Middleware xác thực và bảo mật
├── models/              # MongoDB models
├── routes/              # API endpoints
├── utils/               # Helper functions
└── index.js             # Entry point
```

### Frontend
```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # UI components
│   │   ├── admin/       # Admin dashboard components
│   │   ├── auth/        # Authentication components
│   │   ├── shared/      # Shared components
│   │   └── ui/          # UI library components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── pages/           # Page components
│   ├── redux/           # Redux store và slices
│   └── utils/           # Helper functions
└── index.html           # HTML entry point
```

## 🚢 Triển khai với GKE và ArgoCD

### 1. Chuẩn bị môi trường

- Tạo một cluster GKE trong Google Cloud Console
- Cài đặt và cấu hình `kubectl` và `gcloud` trên máy tính của bạn
- Cài đặt ArgoCD vào cluster

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### 2. Thiết lập Kubernetes Manifest

Dự án đã có sẵn các file manifest cho Kubernetes:
- `backend-deployment.yaml`, `backend-service.yaml`, `backend-hpa.yaml` cho backend
- `frontend-deployment.yaml`, `frontend-service.yaml`, `frontend-hpa.yaml` cho frontend
- `redis.yaml` cho Redis cache
- `app-secrets.yaml` cho các biến môi trường nhạy cảm

### 3. Xây dựng và đẩy Docker Images

Sử dụng Cloud Build để tự động xây dựng và đẩy Docker images lên Google Container Registry:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

### 4. Triển khai ứng dụng với ArgoCD

- Truy cập giao diện ArgoCD
- Tạo một ứng dụng mới, trỏ đến repository Git của bạn
- Chỉ định đường dẫn đến thư mục chứa các file Kubernetes manifest
- Đồng bộ hóa ứng dụng

### 5. Cấu hình biến môi trường

Xem file `app-secrets.yaml` để cấu hình các biến môi trường cần thiết như:
- MongoDB URI
- Google OAuth credentials
- Cloudinary credentials
- Redis URL
- Base URL và Frontend URL

### 6. Kiểm tra triển khai

Kiểm tra xem tất cả các pod đã sẵn sàng:

```bash
kubectl get pods
```

Lấy URL truy cập từ Ingress hoặc Service:

```bash
kubectl get ingress
# hoặc
kubectl get svc
```

## 📷 Ảnh chụp màn hình

<details>
<summary>Trang chủ</summary>
<img src="https://via.placeholder.com/800x450/48A6A7/FFFFFF?text=Trang+Chu" alt="Trang chủ">
</details>

<details>
<summary>Trang tìm kiếm công việc</summary>
<img src="https://via.placeholder.com/800x450/48A6A7/FFFFFF?text=Tim+Kiem+Cong+Viec" alt="Trang tìm kiếm">
</details>

<details>
<summary>Trang chi tiết công việc</summary>
<img src="https://via.placeholder.com/800x450/48A6A7/FFFFFF?text=Chi+Tiet+Cong+Viec" alt="Chi tiết công việc">
</details>

<details>
<summary>Bảng điều khiển Nhà tuyển dụng</summary>
<img src="https://via.placeholder.com/800x450/48A6A7/FFFFFF?text=Bang+Dieu+Khien+Admin" alt="Bảng điều khiển">
</details>

## 📦 API Documentation

API được tổ chức theo các endpoint chính sau:

- `/api/v1/user` - Quản lý người dùng và xác thực
- `/api/v1/company` - Quản lý thông tin công ty
- `/api/v1/job` - Quản lý tin tuyển dụng
- `/api/v1/application` - Quản lý đơn ứng tuyển

Chi tiết API có thể được xem trong tệp Postman Collection đi kèm.

## 🔒 Bảo mật

Dự án áp dụng nhiều biện pháp bảo mật:
- JWT cho xác thực người dùng
- Bcrypt cho mã hóa mật khẩu
- Sanitization cho dữ liệu đầu vào
- Rate limiting để ngăn chặn tấn công brute force
- CORS protection
- Helmet để thiết lập các HTTP header an toàn

## 🚥 Roadmap

- [ ] Thêm tính năng đánh giá công ty
- [ ] Tích hợp chatbot AI cho hỗ trợ tìm kiếm
- [ ] Thêm biểu đồ thống kê cho admin dashboard
- [ ] Phân tích số liệu về việc ứng tuyển
- [ ] Tùy chọn đăng nhập bằng Facebook/LinkedIn
- [ ] Chức năng nhắn tin trực tiếp giữa nhà tuyển dụng và ứng viên

## 👥 Đóng góp

Chúng tôi rất hoan nghênh mọi đóng góp cho dự án! Vui lòng làm theo các bước sau:

1. Fork repository
2. Tạo branch tính năng (`git checkout -b feature/amazing-feature`)
3. Commit các thay đổi (`git commit -m 'Add some amazing feature'`)
4. Push lên branch (`git push origin feature/amazing-feature`)
5. Mở Pull Request

## 📄 Giấy phép

Dự án được cấp phép theo [MIT License](LICENSE).

## 📧 Liên hệ

Nếu có bất kỳ câu hỏi hoặc đề xuất nào, vui lòng liên hệ:

Email: your-email@example.com

---

&copy; 2025 JobPortal. Developed with ❤️ by Your Name.
