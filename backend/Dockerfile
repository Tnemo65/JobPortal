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

# Tạo thư mục làm việc
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app .

# Expose port 8080
EXPOSE 8080

# Biến môi trường cơ bản
ENV NODE_ENV=production
ENV PORT=8080

# Lệnh khởi động app
CMD ["node", "index.js"]