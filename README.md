# JobPortal - Nền tảng tìm việc làm trực tuyến với CI/CD DevOps

## 📚 Giới thiệu

JobPortal là nền tảng tìm việc làm toàn diện được phát triển bằng MERN Stack (MongoDB, Express, React, Node.js), giúp kết nối ứng viên tìm việc và nhà tuyển dụng một cách hiệu quả. Nền tảng này được triển khai theo mô hình DevOps hiện đại với quy trình CI/CD tự động hóa hoàn toàn trên Google Cloud Platform.

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
- **Redux Toolkit**: Quản lý state tập trung cho ứng dụng
- **TailwindCSS**: Framework CSS với các utility class và responsive design
- **Framer Motion**: Thư viện animation cho React
- **Axios**: Thực hiện các HTTP request
- **React Router**: Định tuyến trong ứng dụng
- **Redux Persist**: Lưu trữ state vào local storage
- **shadcn/ui**: Hệ thống UI components có thể tùy chỉnh cao
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
- **Passport.js**: Xác thực với các dịch vụ của bên thứ ba
- **Express Rate Limit**: Giới hạn request để ngăn chặn tấn công

### DevOps & Cloud Infrastructure
- **Docker**: Container hóa ứng dụng để đảm bảo nhất quán giữa các môi trường
- **GitHub**: Quản lý mã nguồn, version control và trigger CI/CD
- **Google Cloud Build**: Dịch vụ CI/CD tự động build Docker images
- **Artifact Registry**: Kho lưu trữ Docker images bảo mật và quản lý version
- **Google Kubernetes Engine (GKE)**: Quản lý, triển khai và mở rộng container
- **ArgoCD**: GitOps continuous delivery tool cho Kubernetes
- **Cloud Load Balancing**: Phân phối lưu lượng truy cập ứng dụng
- **Domain Name (jobmarket.fun)**: Cung cấp địa chỉ dễ nhớ cho người dùng
- **Horizontal Pod Autoscaler**: Tự động scale pods dựa vào tải hệ thống
- **Ingress Controller**: Quản lý truy cập vào các services từ bên ngoài cluster

## 🚢 DevOps Workflow & Triển khai

### Tổng quan quy trình CI/CD
1. Developer push code lên GitHub/GitLab
2. Cloud Build tự động build & tạo Docker image, push lên Artifact Registry
3. ArgoCD phát hiện có image mới, tự động deploy (cập nhật manifest) lên GKE
4. GKE chạy container, cân bằng tải, tự động scale theo nhu cầu

### Hướng dẫn triển khai chi tiết

#### Bước 1: Thiết lập GitHub Repository

#### Bước 2: Cấu hình Cloud Build

1. **Kiểm tra và cập nhật file `cloudbuild.yaml`**:

```yaml
steps:
  # Cài đặt dependencies cho Backend
  - name: 'node:18'
    dir: 'backend'
    entrypoint: 'npm'
    args: ['install']
    id: 'backend-install'
    
  # Build Backend Docker image
  - name: 'gcr.io/cloud-builders/docker'
    dir: 'backend'
    args: ['build', '-t', 'asia-northeast1-docker.pkg.dev/${PROJECT_ID}/jobportal/backend:${SHORT_SHA}', '.']
    id: 'backend-build'
    waitFor: ['backend-install']

  # Push Backend Docker image vào Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'asia-northeast1-docker.pkg.dev/${PROJECT_ID}/jobportal/backend:${SHORT_SHA}']
    id: 'backend-push'
    waitFor: ['backend-build']

  # Cài đặt dependencies cho Frontend
  - name: 'node:18'
    dir: 'frontend'
    entrypoint: 'npm'
    args: ['install']
    id: 'frontend-install'

  # Build Frontend
  - name: 'node:18'
    dir: 'frontend'
    entrypoint: 'npm'
    args: ['run', 'build']
    id: 'frontend-build'
    waitFor: ['frontend-install']
    
  # Build Frontend Docker image
  - name: 'gcr.io/cloud-builders/docker'
    dir: 'frontend'
    args: ['build', '-t', 'asia-northeast1-docker.pkg.dev/${PROJECT_ID}/jobportal/frontend:${SHORT_SHA}', '.']
    id: 'frontend-build-docker'
    waitFor: ['frontend-build']

  # Push Frontend Docker image vào Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'asia-northeast1-docker.pkg.dev/${PROJECT_ID}/jobportal/frontend:${SHORT_SHA}']
    id: 'frontend-push'
    waitFor: ['frontend-build-docker']

  # Cập nhật Kubernetes manifests với image mới
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
    - 'prepare'
    - '--filename=./kubernetes'
    - '--image=asia-northeast1-docker.pkg.dev/${PROJECT_ID}/jobportal/frontend:${SHORT_SHA}'
    - '--image=asia-northeast1-docker.pkg.dev/${PROJECT_ID}/jobportal/backend:${SHORT_SHA}'
    - '--output=./kubernetes/updated'
    id: 'prepare-manifests'
    waitFor: ['frontend-push', 'backend-push']

  # Commit thay đổi manifests vào Git repo để ArgoCD phát hiện
  - name: 'gcr.io/cloud-builders/git'
    entrypoint: 'bash'
    args:
    - '-c'
    - |
      git config --global user.email "cloudbuild@example.com"
      git config --global user.name "Cloud Build"
      git clone https://github.com/your-username/JobPortal-k8s.git
      cp -r ./kubernetes/updated/* ./JobPortal-k8s/
      cd JobPortal-k8s
      git add .
      git commit -m "Update image to ${SHORT_SHA}"
      git push https://oauth2:${_GITHUB_TOKEN}@github.com/your-username/JobPortal-k8s.git
    id: 'commit-manifests'
    waitFor: ['prepare-manifests']

# Lưu trữ các container images
images:
  - 'asia-northeast1-docker.pkg.dev/${PROJECT_ID}/jobportal/backend:${SHORT_SHA}'
  - 'asia-northeast1-docker.pkg.dev/${PROJECT_ID}/jobportal/frontend:${SHORT_SHA}'
```

2. **Cài đặt Cloud Build Trigger**:

```bash
gcloud builds triggers create github \
  --name="jobportal-main" \
  --repo="your-github-repo" \
  --branch-pattern="main" \
  --build-config="cloudbuild.yaml"
```

#### Bước 3: Thiết lập Artifact Registry

1. **Tạo repository**:

```bash
gcloud artifacts repositories create jobportal \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="JobPortal Docker images"
```

2. **Cấu hình Docker để sử dụng Artifact Registry**:

```bash
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

#### Bước 4: Cấu hình Google Kubernetes Engine (GKE)

1. **Tạo cluster** (nếu chưa có):

```bash
gcloud container clusters create jobportal-cluster \
  --zone asia-east1-a \
  --num-nodes=3 \
  --machine-type=e2-standard-2 \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=5
```

2. **Kết nối với cluster**:

```bash
gcloud container clusters get-credentials jobportal-cluster --zone asia-east1-a
```

3. **Tạo các Kubernetes manifests**:

Đảm bảo các file manifest (Deployments, Services, ConfigMaps, Secrets) đã có trong thư mục `kubernetes/`:

```bash
mkdir -p kubernetes
```

**backend-deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  annotations:
    argocd-image-updater.argoproj.io/image-list: backend=asia-northeast1-docker.pkg.dev/your-project-id/jobportal/backend
    argocd-image-updater.argoproj.io/backend.update-strategy: semver
    argocd-image-updater.argoproj.io/write-back-method: git
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: asia-northeast1-docker.pkg.dev/your-project-id/jobportal/backend:latest
        resources:
          requests:
            cpu: 100m
            memory: 200Mi
          limits:
            cpu: 500m
            memory: 500Mi
        envFrom:
        - secretRef:
            name: backend-secrets
        - configMapRef:
            name: backend-config
        ports:
        - containerPort: 8000
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 8000
          initialDelaySeconds: 15
          periodSeconds: 5
```

**frontend-deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  annotations:
    argocd-image-updater.argoproj.io/image-list: frontend=asia-northeast1-docker.pkg.dev/your-project-id/jobportal/frontend
    argocd-image-updater.argoproj.io/frontend.update-strategy: semver
    argocd-image-updater.argoproj.io/write-back-method: git
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: asia-northeast1-docker.pkg.dev/your-project-id/jobportal/frontend:latest
        resources:
          requests:
            cpu: 100m
            memory: 200Mi
          limits:
            cpu: 300m
            memory: 400Mi
        envFrom:
        - configMapRef:
            name: frontend-config
        ports:
        - containerPort: 80
```

**backend-service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 8000
```

**frontend-service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
```

**ingress.yaml**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: jobportal-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
spec:
  rules:
  - host: jobmarket.fun
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

**app-secrets.yaml**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: backend-secrets
type: Opaque
data:
  MONGODB_URI: <base64-encoded-mongodb-uri>
  JWT_SECRET: <base64-encoded-jwt-secret>
  REDIS_URL: <base64-encoded-redis-url>
  CLOUD_NAME: <base64-encoded-cloud-name>
  CLOUD_API_KEY: <base64-encoded-api-key>
  CLOUD_API_SECRET: <base64-encoded-api-secret>
```

#### Bước 5: Cài đặt và cấu hình ArgoCD

1. **Cài đặt ArgoCD vào cluster**:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

2. **Cài đặt ArgoCD CLI**:

```bash
# Trên Linux
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

# Trên macOS
brew install argocd
```

3. **Truy cập ArgoCD UI**:

```bash
# Chuyển tiếp cổng ArgoCD server
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

4. **Lấy mật khẩu admin**:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

5. **Đăng nhập bằng CLI**:

```bash
argocd login localhost:8080
```

6. **Tạo ứng dụng trong ArgoCD**:

```bash
argocd app create jobportal \
  --repo https://github.com/your-username/JobPortal-k8s.git \
  --path . \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace default \
  --sync-policy automated
```

7. **Cài đặt ArgoCD Image Updater**:

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/argocd-image-updater/stable/manifests/install.yaml
```

#### Bước 6: Cấu hình Load Balancer và DNS

1. **Lấy địa chỉ IP của Load Balancer**:

```bash
kubectl get ingress jobportal-ingress
```

2. **Cấu hình DNS**:

Vào nhà cung cấp DNS của bạn (ví dụ: Google Domains, Cloudflare), và tạo bản ghi A trỏ từ `jobmarket.fun` đến địa chỉ IP của Load Balancer.

#### Bước 7: Theo dõi và giám sát hệ thống

1. **Cài đặt Prometheus và Grafana** cho việc giám sát:

```bash
# Thêm Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Cài đặt Prometheus stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

2. **Truy cập Grafana dashboard**:

```bash
kubectl port-forward svc/prometheus-grafana -n monitoring 3000:80
```

Đăng nhập với:
- Username: `admin`
- Password: `prom-operator`

## 🔗 Kết nối các thành phần chính

### Quy trình triển khai ứng dụng
1. **Developer đẩy mã nguồn lên repository**
   - Quy trình bắt đầu khi developer đẩy mã nguồn lên một hệ thống quản lý phiên bản như GitHub hoặc GitLab. Đây là điểm khởi đầu để kích hoạt pipeline CI/CD.

2. **Tự động build và triển khai ứng dụng**
   - Sau khi mã nguồn được đẩy lên, một dịch vụ như Cloud Build sẽ tự động chạy quá trình build, tạo ra Docker image chứa ứng dụng và các phụ thuộc. Image này sau đó được đẩy lên Artifact Registry để lưu trữ.
   - Tiếp theo, công cụ như ArgoCD sẽ phát hiện image mới, cập nhật các tệp cấu hình (manifest) và triển khai ứng dụng lên GKE (Google Kubernetes Engine). GKE sẽ chạy các container, đảm bảo cân bằng tải và tự động mở rộng khi cần thiết.

### Kết nối Google Cloud Monitoring để giám sát ứng dụng
- Sau khi ứng dụng được triển khai trên GKE, Google Cloud Monitoring được tích hợp để theo dõi hiệu suất và tình trạng hoạt động.
- Dịch vụ này thu thập các chỉ số (metrics) như CPU, bộ nhớ, lưu lượng truy cập, cũng như nhật ký (logs) và dấu vết (traces) để cung cấp cái nhìn chi tiết về ứng dụng.
- Nếu có sự cố, đội ngũ vận hành có thể dựa vào thông tin từ Google Cloud Monitoring để phát hiện và xử lý kịp thời.

### Redis hỗ trợ cache hoặc quản lý session
- Redis được sử dụng như một cơ sở dữ liệu lưu trữ trong bộ nhớ để tăng tốc độ xử lý.
  - **Cache dữ liệu**: Lưu trữ tạm thời các kết quả truy vấn hoặc dữ liệu thường xuyên sử dụng, giảm tải cho cơ sở dữ liệu chính.
  - **Quản lý session**: Lưu thông tin phiên người dùng (session data) để đảm bảo trải nghiệm liền mạch, đặc biệt trong các ứng dụng có nhiều người dùng đồng thời.
- Việc này giúp ứng dụng phản hồi nhanh hơn và cải thiện hiệu suất tổng thể.

### Cloudinary xử lý media
- Nếu ứng dụng cần quản lý hình ảnh, video hoặc các nội dung đa phương tiện khác, Cloudinary sẽ được tích hợp để:
  - Tải lên và lưu trữ tệp media.
  - Xử lý media (ví dụ: thay đổi kích thước, nén, chuyển đổi định dạng).
  - Phân phối nội dung qua CDN để tăng tốc độ truy cập.
- Điều này giúp ứng dụng hoạt động hiệu quả với các tài nguyên đa phương tiện mà không làm tăng tải cho hệ thống chính.

### Redux quản lý trạng thái frontend
- Ở phía giao diện người dùng (frontend), Redux được sử dụng để quản lý trạng thái ứng dụng, đặc biệt trong các ứng dụng xây dựng bằng React.
  - **Tổ chức dữ liệu giao diện** một cách tập trung và dễ dự đoán.
  - **Đồng bộ trạng thái** giữa các thành phần giao diện, đảm bảo tính nhất quán.
  - **Dễ dàng debug** và mở rộng ứng dụng khi cần.
- Điều này cải thiện trải nghiệm người dùng và đơn giản hóa việc phát triển frontend.

### JWT đảm bảo xác thực và phân quyền
- Để bảo mật ứng dụng, JWT (JSON Web Tokens) được triển khai nhằm:
  - **Xác thực**: Xác minh danh tính người dùng bằng cách tạo token khi đăng nhập, chứa thông tin như ID người dùng và thời hạn hiệu lực.
  - **Phân quyền**: Kiểm soát quyền truy cập vào các tài nguyên dựa trên vai trò hoặc quyền hạn được mã hóa trong token.
- JWT hoạt động hiệu quả khi kết hợp với Redis (lưu trữ token để kiểm tra nhanh) và đảm bảo chỉ người dùng hợp lệ mới sử dụng được ứng dụng.

### Tóm tắt cách các thành phần kết nối
- **Google Cloud Monitoring**: Giám sát toàn bộ ứng dụng sau khi triển khai trên GKE, cung cấp dữ liệu để tối ưu hóa và xử lý sự cố.
- **Redis**: Tăng tốc ứng dụng bằng cách cache dữ liệu hoặc quản lý session, hỗ trợ backend hoạt động hiệu quả.
- **Cloudinary**: Xử lý và phân phối media, giảm tải cho hệ thống chính và tối ưu trải nghiệm người dùng.
- **Redux**: Quản lý trạng thái frontend, đảm bảo giao diện hoạt động mượt mà và nhất quán.
- **JWT**: Bảo mật ứng dụng thông qua xác thực và phân quyền, kết hợp với Redis để kiểm tra token nhanh chóng.

## 📋 Yêu cầu hệ thống

- Node.js phiên bản 18 trở lên
- MongoDB 5.0 trở lên
- Redis 6.0 trở lên (cho cache và quản lý phiên)
- Tài khoản Google Cloud với các APIs được bật:
  - Container Registry
  - Kubernetes Engine
  - Cloud Build
  - Artifact Registry
- Tài khoản Cloudinary (cho việc lưu trữ hình ảnh và file)

## 🔒 Bảo mật

Dự án áp dụng nhiều biện pháp bảo mật:
- JWT cho xác thực người dùng
- Bcrypt cho mã hóa mật khẩu
- Sanitization cho dữ liệu đầu vào
- Rate limiting để ngăn chặn tấn công brute force
- CORS protection
- Helmet để thiết lập các HTTP header an toàn
- Network Policies trong Kubernetes
- Secrets quản lý bằng Kubernetes Secrets
- HTTPS với TLS termination tại Load Balancer

