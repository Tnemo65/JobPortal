# Build stage - sử dụng phiên bản cụ thể của Node.js
FROM node:18-slim AS builder

# Tạo thư mục làm việc
WORKDIR /usr/src/app

# Copy package.json
COPY package*.json ./

# Cài đặt dependencies với npm ci để đảm bảo tính nhất quán
RUN npm install

# Copy source code
COPY . .

# Runtime stage
FROM node:18-slim

# Tạo user non-root để tăng tính bảo mật
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/false -d /usr/src/app nodejs

# Tạo thư mục làm việc và cấp quyền
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app .
RUN chown -R nodejs:nodejs /usr/src/app

# Chuyển đổi sang user non-root
USER nodejs

# Expose port 8080
EXPOSE 8080

# Biến môi trường (nạp từ docker-compose)
ENV NODE_ENV=production

# Lệnh khởi động app
CMD ["node", "index.js"]