import express from 'express';
import { register, login, logout, refreshToken, getCurrentUser, forgotPassword } from '../controller/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

export default router;