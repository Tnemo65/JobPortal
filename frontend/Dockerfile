# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies bằng npm
RUN npm ci || npm install

# Copy tất cả file còn lại vào container
COPY . .

# Chạy build production
RUN npm run build

# Runtime stage với nginx
FROM nginx:stable-alpine

# Copy thư mục dist (được build từ giai đoạn trước) vào thư mục mặc định của nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Cấu hình nginx cho SPA routing
RUN echo 'server { \
    listen 8080; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose cổng 8080
EXPOSE 8080

# Lệnh khởi động nginx
CMD ["nginx", "-g", "daemon off;"]
