import express from 'express';
import {
    createReview,
    getReviews,
    updateReview,
    deleteReview,
    toggleLike
} from '../controller/reviewController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/', getReviews);

// Protected routes
router.post('/', authenticateToken, createReview);
router.put('/:id', authenticateToken, updateReview);
router.delete('/:id', authenticateToken, deleteReview);
router.post('/:id/like', authenticateToken, toggleLike);

export default router;