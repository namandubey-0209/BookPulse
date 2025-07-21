import express from 'express';
import {
    startReading,
    updateProgress,
    addReadingSession,
    getUserProgress,
    getReadingStats,
    deleteProgress
} from '../controller/readingProgressController.js';
import { authenticateToken } from '../middliwares/auth.js';
//import { validateReadingProgress } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Start reading a book
router.post('/start', startReading);

// Update progress
router.put('/:id', updateProgress);

// Add reading session
router.post('/:id/session', addReadingSession);

// After (safe and reliable)
router.get('/user', getUserProgress);
router.get('/user/:userId', getUserProgress);

router.get('/stats', getReadingStats);
router.get('/stats/:userId', getReadingStats);

// Delete progress
router.delete('/:id', deleteProgress);

export default router;