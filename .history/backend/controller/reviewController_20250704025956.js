import Discussion from '../models/Discussion.js';
import Book from '../models/Book.js';

// Create a review
export const createReview = async (req, res) => {
    try {
        const { bookId, rating, title, content, spoilerWarning = false } = req.body;

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Check if user already reviewed this book
        const existingReview = await Discussion.findOne({
            user: req.user.id,
            book: bookId
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this book' });
        }

        const review = new Review({
            user: req.user.id,
            book: bookId,
            rating,
            title,
            content,
            spoilerWarning
        });

        await review.save();
        await review.populate('user', 'username avatar');
        await review.populate('book', 'title authors');

        // Update book average rating
        await updateBookRating(bookId);

        res.status(201).json({
            message: 'Review created successfully',
            review
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating review', error: error.message });
    }
};

// Get reviews with filters
export const getReviews = async (req, res) => {
    try {
        const { 
            bookId, 
            userId, 
            page = 1, 
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        if (bookId) query.book = bookId;
        if (userId) query.user = userId;

        const reviews = await Review.find(query)
            .populate('user', 'username avatar')
            .populate('book', 'title authors coverImage')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Review.countDocuments(query);

        res.json({
            reviews,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

// Update review
export const updateReview = async (req, res) => {
    try {
        const { rating, title, content, spoilerWarning } = req.body;

        const review = await Review.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Update fields
        if (rating !== undefined) review.rating = rating;
        if (title !== undefined) review.title = title;
        if (content !== undefined) review.content = content;
        if (spoilerWarning !== undefined) review.spoilerWarning = spoilerWarning;

        await review.save();
        await review.populate('user', 'username avatar');
        await review.populate('book', 'title authors');

        // Update book average rating
        await updateBookRating(review.book);

        res.json({
            message: 'Review updated successfully',
            review
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating review', error: error.message });
    }
};

// Delete review
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Update book average rating
        await updateBookRating(review.book);

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting review', error: error.message });
    }
};

// Like/unlike review
export const toggleLike = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const userId = req.user.id;
        const isLiked = review.likes.includes(userId);

        if (isLiked) {
            review.likes.pull(userId);
        } else {
            review.likes.push(userId);
        }

        await review.save();

        res.json({
            message: isLiked ? 'Review unliked' : 'Review liked',
            likesCount: review.likes.length,
            isLiked: !isLiked
        });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling like', error: error.message });
    }
};

// Helper function to update book average rating
const updateBookRating = async (bookId) => {
    try {
        const reviews = await Review.find({ book: bookId });
        
        if (reviews.length === 0) {
            await Book.findByIdAndUpdate(bookId, {
                averageRating: 0,
                ratingsCount: 0
            });
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await Book.findByIdAndUpdate(bookId, {
            averageRating: Math.round(averageRating * 100) / 100,
            ratingsCount: reviews.length
        });
    } catch (error) {
        console.error('Error updating book rating:', error);
    }
};
