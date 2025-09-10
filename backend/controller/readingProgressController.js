import UserBook from '../models/UserBook.js';
import Book from '../models/Book.js';
import mongoose from 'mongoose';

export const startReading = async (req, res) => {
    try {
        const { bookId, totalPages } = req.body;
        const userId = req.user.id;

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: 'Book not found' });

        let progress = await UserBook.findOne({ user: userId, book: bookId });

        if (progress) {
            progress.status = 'reading';
            progress.startDate = progress.startDate || new Date();
            if (totalPages) progress.totalPages = totalPages;
        } else {
            progress = new UserBook({
                user: userId,
                book: bookId,
                status: 'reading',
                totalPages: totalPages || book.pageCount || 0,
                startDate: new Date()
            });
        }

        await progress.save();
        await progress.populate('book', 'title authors coverImage');

        res.status(201).json({ message: 'Started reading book', progress });
    } catch (error) {
        res.status(500).json({ message: 'Error starting book', error: error.message });
    }
};

export const updateProgress = async (req, res) => {
    try {
        const { currentPage, notes, status } = req.body;
        const progressId = req.params.id;

        const progress = await UserBook.findOne({ _id: progressId, user: req.user.id }).populate('book', 'title authors');

        if (!progress) return res.status(404).json({ message: 'Reading progress not found' });

        if (currentPage !== undefined) progress.currentPage = currentPage;
        if (notes !== undefined) progress.notes = notes;
        if (status !== undefined) {
            progress.status = status;
            if (status === 'finished' && !progress.finishDate) {
                progress.finishDate = new Date();
            }
        }

        await progress.save();

        res.json({ message: 'Progress updated successfully', progress });
    } catch (error) {
        res.status(500).json({ message: 'Error updating progress', error: error.message });
    }
};

export const addReadingSession = async (req, res) => {
    try {
        const { pagesRead, timeSpent, notes } = req.body;
        const progressId = req.params.id;

        const progress = await UserBook.findOne({ _id: progressId, user: req.user.id });

        if (!progress) return res.status(404).json({ message: 'Reading progress not found' });

        progress.readingSessions.push({
            date: new Date(),
            pagesRead,
            timeSpent,
            notes
        });

        progress.currentPage += pagesRead;

        if (progress.currentPage >= progress.totalPages && progress.status === 'reading') {
            progress.status = 'finished';
            progress.finishDate = new Date();
        }

        await progress.save();

        res.json({ message: 'Reading session added', progress });
    } catch (error) {
        res.status(500).json({ message: 'Error adding session', error: error.message });
    }
};

export const getReadingSessions = async (req, res) => {
    try {
        const progressId = req.params.id;

        const progress = await UserBook.findOne({ _id: progressId, user: req.user.id })
            .select('readingSessions book')
            .populate('book', 'title authors coverImage');

        if (!progress) return res.status(404).json({ message: 'Reading progress not found' });

        res.json({ book: progress.book, readingSessions: progress.readingSessions });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reading sessions', error: error.message });
    }
};

export const getUserProgress = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        const { status, page = 1, limit = 20 } = req.query;

        const query = { user: userId };
        if (status) query.status = status;

        const progress = await UserBook.find(query)
            .populate('book', 'title authors coverImage pageCount')
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await UserBook.countDocuments(query);

        res.json({
            progress,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching progress', error: error.message });
    }
};

export const getReadingStats = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year + 1}-01-01`);

        const stats = await UserBook.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalPages: { $sum: '$currentPage' }
                }
            }
        ]);

        const recentProgress = await UserBook.find({
            user: userId,
            'readingSessions.0': { $exists: true }
        })
        .sort({ 'readingSessions.date': -1 })
        .limit(30);

        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);

            const hasReadingOnDate = recentProgress.some(progress =>
                progress.readingSessions.some(session =>
                    new Date(session.date).toDateString() === checkDate.toDateString()
                )
            );

            if (hasReadingOnDate) streak++;
            else if (i > 0) break;
        }

        const booksFinished = stats.find(s => s._id === 'finished')?.count || 0;
        const totalPages = stats.reduce((sum, s) => sum + s.totalPages, 0);
        const currentlyReading = stats.find(s => s._id === 'reading')?.count || 0;

        res.json({
            year,
            booksFinished,
            totalPages,
            currentlyReading,
            readingStreak: streak,
            yearlyStats: stats
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
};

export const deleteProgress = async (req, res) => {
    try {
        const progress = await UserBook.findOneAndDelete({ _id: req.params.id, user: req.user.id });

        if (!progress) return res.status(404).json({ message: 'Reading progress not found' });

        res.json({ message: 'Reading progress deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting progress', error: error.message });
    }
};
