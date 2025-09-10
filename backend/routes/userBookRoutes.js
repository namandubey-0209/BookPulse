import express from 'express';
import {
  searchBooks,
  addBook,
  getBookDetails,
  getAllBooks,
  getRecommendations,
  getUserBooks,
  getReadingStats,
  addBookToShelf,
  getUserBook,
  updateBookStatus,
  updateReadingProgress,
  addReadingSession,
  removeBookFromShelf
} from '../controller/userBookController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Book catalog and search
router.get('/search', searchBooks);
router.post('/catalog', addBook);
router.get('/catalog/:bookId', getBookDetails);
router.get('/catalog', getAllBooks);
router.get('/recommendations', getRecommendations);

// User shelf & reading
router.get('/user/:userId', getUserBooks);
router.get('/user/:userId/stats', getReadingStats);
router.post('/', addBookToShelf);
router.get('/:userBookId', getUserBook);
router.put('/:userBookId', updateBookStatus);
router.put('/:userBookId/progress', updateReadingProgress);
router.post('/:userBookId/session', addReadingSession);
router.delete('/:userBookId', removeBookFromShelf);

export default router;
