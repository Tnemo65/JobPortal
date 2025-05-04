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
        
        // Debug MongoDB connection string
        if (process.env.MONGO_URI) {
            // Check if it's base64 encoded (as in Kubernetes secrets)
            try {
                const possibleB64 = process.env.MONGO_URI;
                const decoded = Buffer.from(possibleB64, 'base64').toString();
                
                // Only log if it looks like a MongoDB URI (to avoid logging random text)
                if (decoded.includes('mongodb://') || decoded.includes('mongodb+srv://')) {
                    // Extract host/cluster information only, don't log credentials
                    const safeUri = decoded.replace(/\/\/([^:]+):([^@]+)@/, '//[USERNAME]:[REDACTED]@');
                    console.log('Decoded MongoDB URI format:', safeUri);
                    
                    // If the environment has the base64 encoded version, set the decoded version
                    if (!decoded.startsWith('mongodb://') && !decoded.startsWith('mongodb+srv://')) {
                        console.error('Decoded MongoDB URI does not start with the correct protocol prefix');
                    } else {
                        // Replace the encoded version with the decoded version
                        process.env.MONGO_URI = decoded;
                        console.log('Successfully decoded MongoDB URI from base64 format');
                    }
                } else {
                    console.log('MongoDB URI is not base64 encoded or does not contain a valid MongoDB connection string');
                }
            } catch (error) {
                console.error('Error when attempting to decode MongoDB URI:', error.message);
            }
        } else {
            console.error('MONGO_URI environment variable is not set');
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