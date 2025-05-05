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
let redisConnected = false;

console.log('Redis environment check:');
console.log('- REDIS_URL:', process.env.REDIS_URL ? 'Defined' : 'Not defined');
console.log('- USE_REDIS_CACHE:', process.env.USE_REDIS_CACHE);
console.log('- USE_REDIS_SESSIONS:', process.env.USE_REDIS_SESSIONS);

// Create Redis client for session storage and potentially caching
if (enableRedis && process.env.REDIS_URL) {
    try {
        console.log('Initializing Redis client with URL:', 
            process.env.REDIS_URL.replace(/\/\/(.*)@/, '//***@')); // Log URL with hidden credentials
        
        // Create Redis client with optimized configuration
        redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    // Exponential backoff strategy with max retry
                    if (retries > 10) {
                        console.error(`Redis connection failed after ${retries} attempts, giving up`);
                        return new Error('Redis connection attempts exhausted');
                    }
                    const delay = Math.min(retries * 50, 3000);
                    console.log(`Retrying Redis connection in ${delay}ms (attempt ${retries})`);
                    return delay;
                },
                connectTimeout: 10000, // 10 seconds
            }
        });

        redisClient.on('error', (err) => {
            console.error('Redis client error:', err);
            redisConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('Redis client connected successfully');
            redisConnected = true;
        });
        
        redisClient.on('reconnecting', () => {
            console.log('Redis client reconnecting...');
            redisConnected = false;
        });
        
        redisClient.on('end', () => {
            console.log('Redis client connection closed');
            redisConnected = false;
        });

        // Connect to Redis - make this non-blocking so it doesn't prevent app startup
        (async () => {
            try {
                await redisClient.connect();
                // Set a flag to indicate Redis is connected successfully
                redisConnected = true;
                console.log('Redis connection established successfully');
                
                // Test connection with a simple ping
                const pingResult = await redisClient.ping();
                console.log('Redis ping result:', pingResult);
            } catch (err) {
                console.error('Failed to connect to Redis during initialization:', err);
                redisConnected = false;
                redisClient = null; // Reset client completely on connection failure
            }
        })();
    } catch (err) {
        console.error('Failed to create Redis client:', err);
        redisClient = null;
        redisConnected = false;
    }
} else {
    console.log('Redis not enabled or URL not provided, skipping Redis initialization');
    console.log('Application will use in-memory store for sessions and caching');
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
    redisClient: cacheWithRedis && redisClient && redisClient.isReady ? redisClient : null,
    // Default TTL handling
    defaultDuration: '5 minutes',
    // Enable debug logs in development
    debug: process.env.NODE_ENV === 'development',
    // Headers that prevent caching
    headerBlacklist: ['authorization', 'cookie']
};

// Configure apicache
const cacheInstance = apicache.options(cacheOptions);
// Create middleware function
const cacheMiddleware = cacheInstance.middleware;

// Helper function to clear cache for a specific user
const clearUserCache = async (userId) => {
    if (redisClient && redisClient.isReady && redisConnected) {
        try {
            // Clear user-specific cache keys
            const keys = await redisClient.keys(`apicache:*:${userId}:*`);
            if (keys.length > 0) {
                await redisClient.del(keys);
                console.log(`Cleared ${keys.length} cache entries for user ${userId}`);
            }
        } catch (error) {
            console.error(`Error clearing cache for user ${userId}:`, error);
        }
    } else {
        // Use apicache's built-in clear method if Redis is not available
        cacheInstance.clear();
    }
};

// Helper to check if Redis is connected and ready
const isRedisReady = () => {
    return !!(redisClient && redisClient.isReady && redisConnected);
};

// Export the original apicache instance and the middleware function
export { 
    cacheInstance as apiCache,
    cacheMiddleware as middleware,
    redisClient, 
    clearUserCache, 
    isRedisReady, 
    redisConnected 
};