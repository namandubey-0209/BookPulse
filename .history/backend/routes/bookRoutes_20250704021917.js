import express from 'express';
import {
    searchBooks,
    addBook,
    getBookDetails,
    getAllBooks
} from '../';
import { authenticateToken, optionalAuth } from '../middliwares/auth.js';

const router = express.Router();

// Public routes
router.get('/search', searchBooks);
router.get('/', getAllBooks);
router.get('/:id', optionalAuth, getBookDetails);

// Protected routes
router.post('/', authenticateToken, addBook);
//router.get('/recommendations/user', authenticateToken, getRecommendations);

export default router;