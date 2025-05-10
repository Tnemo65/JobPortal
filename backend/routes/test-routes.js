import express from "express";

const router = express.Router();

// Route kiểm tra trạng thái backend
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'success',
      message: 'Backend API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

export default router;