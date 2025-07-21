import express from 'express';
import {
    getUserProfile,
    updateUserProfile,
    toggleFollow,
    getActivityFeed
} from '../controller/userController.js
';
import { authenticateToken } from '../middleware/auth.js';
//import { validateUserUpdate } from '../middleware/validation.js';

const router = express.Router();

// Get user profile (public)
router.get('/:id', getUserProfile);

// Protected routes
router.put('/profile', authenticateToken, updateUserProfile);
router.post('/:id/follow', authenticateToken, toggleFollow);
router.get('/feed/activity', authenticateToken, getActivityFeed);

export default router;