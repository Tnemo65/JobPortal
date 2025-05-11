import apicache from 'apicache';
import dotenv from 'dotenv';

dotenv.config();

console.log('Sử dụng memory cache cho API');

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
const apiCache = apicache.options(cacheOptions);
console.log("apiCache available:", !!apiCache);
// Helper function to clear cache for a specific user
const clearUserCache = async (userId) => {
    // Sử dụng apicache's built-in clear method
    apiCache.clear();
    console.log(`Đã xóa cache cho user ${userId}`);
};

export { apiCache, clearUserCache };