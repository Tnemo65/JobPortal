import apicache from 'apicache';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Determine whether to use Redis for API caching
const cacheWithRedis = process.env.USE_REDIS_CACHE === 'true';
// Always enable Redis for sessions regardless of caching preference
const enableRedis = cacheWithRedis || process.env.USE_REDIS_SESSIONS === 'true';

// Initialize Redis client
let redisClient = null;

// Create Redis client for session storage and potentially caching
if (enableRedis) {
    try {
        // Create Redis client with optimized configuration
        redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    // Exponential backoff strategy
                    return Math.min(retries * 50, 1000);
                }
            }
        });

        redisClient.on('error', (err) => {
            console.error('Redis client error:', err);
        });

        redisClient.on('connect', () => {
            console.log('Redis client connected successfully');
        });

        // Connect to Redis
        (async () => {
            await redisClient.connect();
        })();
    } catch (err) {
        console.error('Failed to create Redis client:', err);
        redisClient = null;
    }
}

// Cấu hình apicache để sử dụng Redis nếu có
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
    redisClient: cacheWithRedis ? redisClient : null,
    // Default TTL handling
    defaultDuration: '5 minutes',
    // Enable debug logs in development
    debug: process.env.NODE_ENV === 'development',
    // Headers that prevent caching
    headerBlacklist: ['authorization', 'cookie']
};

// Khởi tạo apicache
const apiCache = apicache.options(cacheOptions);

// Helper function to clear cache for a specific user
const clearUserCache = async (userId) => {
    if (cacheWithRedis && redisClient) {
        try {
            // Get all keys with this user's ID
            const keys = await redisClient.keys(`*${userId}*`);
            if (keys.length > 0) {
                await redisClient.del(keys);
                console.log(`Cleared ${keys.length} cache entries for user ${userId}`);
            }
        } catch (error) {
            console.error(`Error clearing cache for user ${userId}:`, error);
        }
    } else {
        // Use apicache's built-in clear method if Redis is not available
        apiCache.clear();
    }
};

export { apiCache, redisClient, clearUserCache };