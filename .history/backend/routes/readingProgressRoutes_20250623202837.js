import express from 'express';
import {
    startReading,
    updateProgress,
    addReadingSession,
    getUserProgress,
    getReadingStats,
    deleteProgress
} from '../controllers/readingProgressController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateReadingProgress } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Start reading a book
router.post('/start', validateReadingProgress, startReading);

// Update progress
router.put('/:id', updateProgress);

// Add reading session
router.post('/:id/session', addReadingSession);

// Get user's progress
router.get('/user/:userId?', getUserProgress);

// Get reading statistics
router.get('/stats/:userId?', getReadingStats);

// Delete progress
router.delete('/:id', deleteProgress);

export default router;