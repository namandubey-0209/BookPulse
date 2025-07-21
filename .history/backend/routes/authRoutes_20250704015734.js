import express from 'express';
import { register, login, logout, refreshToken, getMe } from '../controllers/auth.js';
import { authenticateToken } from '../middleware/auth.js';
//import { validateRegister, validateLogin } from '../middleware/validation.js';
//import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to auth routes
router.use(rateLimiter);

// Public routes
router.post('/register', register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authenticateToken, getMe);

export default router;