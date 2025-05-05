import express from "express";
import { redisClient } from "../utils/redis-cache.js";

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
export {redisClient };
export default router;