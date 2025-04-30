# Build stage - sử dụng phiên bản cụ thể của Node.js
FROM node:18-slim

# Tạo thư mục làm việc
WORKDIR /usr/src/app

# Copy package.json
COPY package*.json ./

# Cài đặt dependencies với npm
RUN npm install

# Copy source code
COPY . .

# Expose port 8080
EXPOSE 8080

# Biến môi trường cho development
ENV NODE_ENV=development
ENV PORT=8080

# Cài đặt nodemon toàn cục để development
RUN npm install -g nodemon

# Lệnh khởi động app sử dụng npm run dev
CMD ["npm", "run", "dev"]