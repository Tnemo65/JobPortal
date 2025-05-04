// Environment variables configuration for GKE deployment

export const setupEnvironment = () => {
    // Kiểm tra nếu đang chạy trong Kubernetes
    if (process.env.KUBERNETES_SERVICE_HOST) {
        console.log("Detected Kubernetes environment - setting production variables");
        
        // Đặt NODE_ENV thành production
        process.env.NODE_ENV = 'production';
        
        // Thiết lập các URL mặc định nếu chưa được cung cấp
        if (!process.env.FRONTEND_URL) {
            process.env.FRONTEND_URL = 'http://35.234.9.125';
            console.log(`Set default FRONTEND_URL: ${process.env.FRONTEND_URL}`);
        }
        
        if (!process.env.BACKEND_URL) {
            process.env.BACKEND_URL = 'http://34.81.121.101';
            console.log(`Set default BACKEND_URL: ${process.env.BACKEND_URL}`);
        }
        
        // Đặt CORS_ALLOWED_ORIGINS
        process.env.CORS_ALLOWED_ORIGINS = process.env.FRONTEND_URL;
        console.log(`Set CORS_ALLOWED_ORIGINS: ${process.env.CORS_ALLOWED_ORIGINS}`);
        
        // Log cấu hình
        console.log('Environment configured for GKE:');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
        console.log('BACKEND_URL:', process.env.BACKEND_URL);
    }
};