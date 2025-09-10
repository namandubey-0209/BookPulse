import express from 'express';
import {
  getDiscussions,
  getDiscussion,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addReply,
  updateReply,
  deleteReply,
  toggleDiscussionLike,
  toggleReplyLike
} from '../controller/discussionController.js';
import { authenticateToken } from '../middlewares/auth.js';  // Fixed typo: "middlewares" not "middliwares"

const router = express.Router();

// Discussion CRUD
router.get('/', getDiscussions);
router.get('/:id', getDiscussion);
router.post('/', authenticateToken, createDiscussion);
router.put('/:id', authenticateToken, updateDiscussion);
router.delete('/:id', authenticateToken, deleteDiscussion);

// Discussion likes
router.post('/:id/like', authenticateToken, toggleDiscussionLike);

// Replies
router.post('/:id/replies', authenticateToken, addReply);
router.put('/:discussionId/replies/:replyId', authenticateToken, updateReply);
router.delete('/:discussionId/replies/:replyId', authenticateToken, deleteReply);
router.post('/:discussionId/replies/:replyId/like', authenticateToken, toggleReplyLike);

export default router;
