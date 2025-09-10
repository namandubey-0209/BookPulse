import express from 'express'
import {
  getUserProfile,
  updateUserProfile,
  toggleFollow,
  getActivityFeed,
  getFriends,
  searchUsers,
  getUserStats,
  getReadingGoal,
  updateReadingGoal
} from '../controller/userController.js'
import { authenticateToken } from '../middlewares/auth.js'

const router = express.Router()

// Public routes
router.get('/:id', getUserProfile)
router.get('/:id/friends', getFriends)
router.get('/search', searchUsers)

// Protected routes
router.use(authenticateToken)

router.put('/profile', updateUserProfile)
router.post('/:id/follow', toggleFollow)
router.get('/feed/activity', getActivityFeed)
router.get('/:id/stats', getUserStats)
router.get('/:id/reading-goal', getReadingGoal)
router.put('/reading-goal', updateReadingGoal)

export default router
