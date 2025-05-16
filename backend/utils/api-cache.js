import apicache from 'apicache';
import dotenv from 'dotenv';

dotenv.config();

console.log('Sử dụng memory cache cho API');

// Bộ nhớ cache cho các tóm tắt AI và dữ liệu khác
const memoryCache = new Map();

// Cấu hình apicache để sử dụng memory cache
const cacheOptions = {
    statusCodes: {
        include: [200]
    },
    appendKey: (req) => {
        // Create cache keys based on user role and query parameters
        const userId = req.id ? req.id : 'guest';
        const role = req.user?.role || 'guest';
        const queryParams = req.query ? new URLSearchParams(req.query).toString() : '';
        
        // Include route-specific parameters in the cache key
        let routeParams = '';
        if (req.params && Object.keys(req.params).length > 0) {
            routeParams = `-${Object.values(req.params).join('-')}`;
        }
        
        // Build a comprehensive cache key
        return `${role}-${userId}${routeParams}${queryParams ? '-' + queryParams : ''}`;
    },
    // Default TTL handling
    defaultDuration: '5 minutes',
    // Enable debug logs in development
    debug: process.env.NODE_ENV === 'development',
    // Headers that prevent caching
    headerBlacklist: ['authorization', 'cookie']
};

// Khởi tạo apicache với memory cache
const apicacheInstance = apicache.options(cacheOptions);
console.log("apicache middleware available:", !!apicacheInstance);

// Tạo wrapper để bổ sung thêm các phương thức get/set cho cache
export const apiCache = {
    // Giữ lại middleware function từ apicache
    middleware: apicacheInstance.middleware,
    
    // Thêm phương thức get để lấy dữ liệu từ cache theo key
    get: (key) => {
        const item = memoryCache.get(key);
        if (!item) return null;
        
        // Kiểm tra hạn sử dụng
        if (item.expires && item.expires < Date.now()) {
            memoryCache.delete(key);
            return null;
        }
        
        return item.value;
    },
    
    // Thêm phương thức set để lưu dữ liệu vào cache với thời gian sống (TTL)
    set: (key, value, ttlSeconds = 300) => {
        const expires = Date.now() + (ttlSeconds * 1000);
        memoryCache.set(key, { value, expires });
        console.log(`Cache set: ${key} (expires in ${ttlSeconds}s)`);
        return true;
    },
    
    // Thêm phương thức clear để xóa cache theo prefix hoặc toàn bộ
    clear: (prefix) => {
        if (!prefix) {
            memoryCache.clear();
            apicacheInstance.clear();
            console.log('Cleared all cache');
            return true;
        }
        
        let count = 0;
        for (const key of memoryCache.keys()) {
            if (key.startsWith(prefix)) {
                memoryCache.delete(key);
                count++;
            }
        }
        
        // Cũng xóa cache của apicache
        apicacheInstance.clear(prefix);
        console.log(`Cleared ${count} cache entries with prefix: ${prefix}`);
        return true;
    }
};

// Helper function to clear cache for a specific user
export const clearUserCache = async (userId) => {
    apiCache.clear(`user_${userId}`);
    console.log(`Đã xóa cache cho user ${userId}`);
};