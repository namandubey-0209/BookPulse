import express from 'express';
import {
    createReview,
    getReviews,
    updateReview,
    deleteReview,
    toggleLike
} from '../controllers/reviewController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
//import { validateReview } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/', getReviews);

// Protected routes
router.post('/', authenticateToken, createReview);
router.put('/:id', authenticateToken, validateReview, updateReview);
router.delete('/:id', authenticateToken, deleteReview);
router.post('/:id/like', authenticateToken, toggleLike);

export default router;