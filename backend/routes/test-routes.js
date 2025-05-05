import express from 'express';
import { redisClient, isRedisReady } from '../utils/redis-cache.js';

const router = express.Router();

// Route kiểm tra Redis
router.get('/test-redis', async (req, res) => {
  try {
    if (!redisClient || !redisClient.isReady) {
      return res.status(500).json({
        status: 'error',
        message: 'Redis client not ready',
        connection: {
          status: redisClient ? redisClient.status : 'not_initialized',
          host: process.env.REDIS_URL,
        }
      });
    }

    // Test PING
    const pingResult = await redisClient.ping();
    
    // Test SET/GET
    await redisClient.set('test-key', 'Hello Redis!');
    const value = await redisClient.get('test-key');
    
    res.json({
      status: 'success',
      ping: pingResult,
      testValue: value,
      connection: {
        status: redisClient.status,
        host: process.env.REDIS_URL.replace(/\/\/(.*)@/, '//***@'),
        isReady: redisClient.isReady
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
      connection: {
        status: redisClient ? redisClient.status : 'not_initialized',
        host: process.env.REDIS_URL ? process.env.REDIS_URL.replace(/\/\/(.*)@/, '//***@') : 'not_set'
      }
    });
  }
});

// Debug endpoint to check Redis connectivity
router.get('/redis-status', async (req, res) => {
    try {
        const isConnected = isRedisReady();
        const redisInfo = isConnected ? {
            isReady: redisClient.isReady,
            isOpen: redisClient.isOpen,
            socketConnected: redisClient.options?.socket?.connectTimeout ? true : false
        } : null;
        
        // Check existing sessions in Redis
        let sessions = [];
        if (isConnected) {
            try {
                const keys = await redisClient.keys('sess:*');
                sessions = keys.slice(0, 5); // Lấy tối đa 5 phiên mẫu
            } catch (err) {
                console.error('Error fetching session keys:', err);
            }
        }
        
        res.json({
            redisEnabled: !!redisClient,
            redisConnected: isConnected,
            redisInfo,
            exampleSessions: sessions,
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                REDIS_URL: process.env.REDIS_URL ? `${process.env.REDIS_URL.substring(0, 8)}...` : null,
                USE_REDIS_SESSIONS: process.env.USE_REDIS_SESSIONS,
                USE_REDIS_CACHE: process.env.USE_REDIS_CACHE,
            }
        });
    } catch (error) {
        console.error('Redis status check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint để kiểm tra cookie
router.get('/cookie-test', (req, res) => {
    // Đặt một cookie thử nghiệm để kiểm tra cài đặt
    res.cookie('test_cookie', 'test_value', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60000 // 1 phút
    });
    
    // Trả về tất cả các cookie hiện tại
    res.json({
        cookies: req.cookies,
        sessionID: req.sessionID || null,
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? { id: req.user.id, role: req.user.role } : null
    });
});

export default router;