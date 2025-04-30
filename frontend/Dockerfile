# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Copy package.json trước
COPY package.json ./

# Kiểm tra xem có file yarn.lock hay không và copy nếu có
COPY yarn.lock* ./
COPY package-lock.json* ./

# Sử dụng npm hoặc yarn tùy theo file lock có sẵn
RUN if [ -f yarn.lock ]; then \
        yarn install --frozen-lockfile; \
    else \
        npm ci || npm install; \
    fi

COPY . .
RUN chmod +x ./node_modules/.bin/vite
# Build production
RUN if [ -f yarn.lock ]; then \
        yarn build; \
    else \
        npm run build; \
    fi

# Runtime stage với nginx
FROM nginx:stable-alpine

# Copy cấu hình SPA routing cho Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Tạo file cấu hình Nginx cho SPA routing
RUN echo 'server { \
    listen 8080; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]