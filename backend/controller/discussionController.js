import Discussion from '../models/Discussion.js';
import Book from '../models/Book.js';
import mongoose from 'mongoose';

// Get discussions with filters + pagination + sorting
export const getDiscussions = async (req, res) => {
  try {
    const { 
      bookId, 
      userId, 
      category,
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const query = {};
    if (bookId) query.book = bookId;
    if (userId) query.author = userId;
    if (category && category !== 'all') query.category = category;

    const discussions = await Discussion.find(query)
      .populate('author', 'username')
      .populate('book', 'title authors coverImage')
      .populate('replies.author', 'username')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Discussion.countDocuments(query);

    res.json({
      discussions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching discussions', error: error.message });
  }
};

// Get single discussion by ID
export const getDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('author', 'username')
      .populate('book', 'title authors coverImage')
      .populate('replies.author', 'username');

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    res.json({ discussion });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching discussion', error: error.message });
  }
};

// Create a new discussion
export const createDiscussion = async (req, res) => {
  try {
    const { bookId, content, category = 'general' } = req.body;

    if (!bookId || !content) {
      return res.status(400).json({ message: 'Book ID and content are required' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const discussion = new Discussion({
      book: bookId,
      author: req.user.id,
      content,
      category
    });

    await discussion.save();
    await discussion.populate('author', 'username');
    await discussion.populate('book', 'title authors coverImage');

    res.status(201).json({
      message: 'Discussion created successfully',
      discussion
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating discussion', error: error.message });
  }
};

// Update discussion
export const updateDiscussion = async (req, res) => {
  try {
    const { content, category } = req.body;
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    if (discussion.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this discussion' });
    }

    discussion.content = content || discussion.content;
    discussion.category = category || discussion.category;

    await discussion.save();
    await discussion.populate('author', 'username');
    await discussion.populate('book', 'title authors coverImage');

    res.json({ message: 'Discussion updated', discussion });
  } catch (error) {
    res.status(500).json({ message: 'Error updating discussion', error: error.message });
  }
};

// Delete discussion
export const deleteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    if (discussion.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this discussion' });
    }

    await Discussion.findByIdAndDelete(req.params.id);  // Fixed: use findByIdAndDelete instead of .remove()

    res.json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting discussion', error: error.message });
  }
};

// Toggle like on a discussion
export const toggleDiscussionLike = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const userId = req.user.id;
    const isLiked = discussion.likes.includes(userId);

    if (isLiked) {
      discussion.likes.pull(userId);  // Remove like
    } else {
      discussion.likes.push(userId);  // Add like
    }

    await discussion.save();

    res.json({ 
      message: 'Like toggled', 
      likesCount: discussion.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling like', error: error.message });
  }
};

// Add reply to discussion
export const addReply = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const reply = {
      author: req.user.id,
      content,
      createdAt: new Date()
    };

    discussion.replies.push(reply);
    await discussion.save();
    await discussion.populate('replies.author', 'username');

    res.status(201).json({ 
      message: 'Reply added', 
      reply: discussion.replies[discussion.replies.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding reply', error: error.message });
  }
};

// Update a reply
export const updateReply = async (req, res) => {
  try {
    const { content } = req.body;
    const { discussionId, replyId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const reply = discussion.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (reply.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this reply' });
    }

    reply.content = content || reply.content;
    reply.updatedAt = new Date();
    
    await discussion.save();
    await discussion.populate('replies.author', 'username');

    res.json({ message: 'Reply updated', reply });
  } catch (error) {
    res.status(500).json({ message: 'Error updating reply', error: error.message });
  }
};

// Delete a reply
export const deleteReply = async (req, res) => {
  try {
    const { discussionId, replyId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const reply = discussion.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (reply.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this reply' });
    }

    discussion.replies.pull(replyId);  // Fixed: use pull() instead of remove()
    await discussion.save();

    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting reply', error: error.message });
  }
};

// Toggle like on a reply
export const toggleReplyLike = async (req, res) => {
  try {
    const { discussionId, replyId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const reply = discussion.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const userId = req.user.id;
    const isLiked = reply.likes.includes(userId);

    if (isLiked) {
      reply.likes.pull(userId);  
    } else {
      reply.likes.push(userId);  
    }

    await discussion.save();

    res.json({ 
      message: 'Reply like toggled', 
      likesCount: reply.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling reply like', error: error.message });
  }
};
