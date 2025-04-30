# Development environment
FROM node:18-slim

# Tạo thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies bằng npm
RUN npm install

# Copy tất cả file còn lại vào container
COPY . .

# Expose cổng 5173 (mặc định của Vite dev server)
EXPOSE 5173

# Lệnh khởi động Vite development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
