import express from 'express';
import {
  startReading,
  updateProgress,
  addReadingSession,
  getUserProgress,
  getReadingStats,
  deleteProgress,
  getReadingSessions      // newly imported
} from '../controller/readingProgressController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Start reading a book
router.post('/start', startReading);

// Update reading progress
router.put('/:id', updateProgress);

// Add reading session
router.post('/:id/session', addReadingSession);

// Get all reading sessions for a book
router.get('/:id/sessions', getReadingSessions);    // added GET /:id/sessions

// Get user's reading progress list
router.get('/user', getUserProgress);
router.get('/user/:userId', getUserProgress);

// Get reading statistics
router.get('/stats', getReadingStats);
router.get('/stats/:userId', getReadingStats);

// Delete reading progress (remove book from shelf)
router.delete('/:id', deleteProgress);

export default router;
