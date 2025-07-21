import Book from '../models/Book.js';
import progress from '../models/UserBook.js';
import openLibraryService from '../services/openLibraryService.js';

// Search books using Open Library API
export const searchBooks = async (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;
        
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const books = await openLibraryService.searchBooks(q, page, limit);
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: 'Error searching books', error: error.message });
    }
};

// Add book to database
export const addBook = async (req, res) => {
    try {
        const bookData = {
            ...req.body,
            addedBy: req.user.id
        };

        // Check if book already exists
        const existingBook = await Book.findOne({
            $or: [
                { openLibraryId: bookData.openLibraryId },
                { isbn: bookData.isbn },
                { title: bookData.title, authors: { $in: bookData.authors } }
            ]
        });

        if (existingBook) {
            return res.status(200).json({ 
                message: 'Book already exists', 
                book: existingBook 
            });
        }

        const book = new Book(bookData);
        await book.save();
        
        res.status(201).json({
            message: 'Book added successfully',
            book
        });
    } catch (error) {
        res.status(500).json({ message: 'Error adding book', error: error.message });
    }
};

// Get book details with reviews and reading progress
export const getBookDetails = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('addedBy', 'username');
        
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Get user's reading progress if authenticated
        let userProgress = null;
        if (req.user) {
            userProgress = await progress.findOne({
                user: req.user.id,
                book: book._id
            });
        }

        res.json({
            book,
            userProgress
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching book details', error: error.message });
    }
};

// Get all books with filters
export const getAllBooks = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            genre, 
            author, 
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        
        if (genre) query.genres = { $in: [genre] };
        if (author) query.authors = { $in: [author] };
        if (search) {
            query.$text = { $search: search };
        }

        const books = await Book.find(query)
            .populate('addedBy', 'username')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Book.countDocuments(query);

        res.json({
            books,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching books', error: error.message });
    }
};

// Get book recommendations
export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user's reading history
        const userProgress = await .find({
            user: userId,
            status: { $in: ['finished', 'reading'] }
        }).populate('book');

        if (userProgress.length === 0) {
            // Return popular books for new users
            const popularBooks = await Book.find({})
                .sort({ ratingsCount: -1, averageRating: -1 })
                .limit(10);
            
            return res.json({
                recommendations: popularBooks,
                reason: 'Popular books'
            });
        }

        // Get user's favorite genres
        const readGenres = userProgress.flatMap(p => p.book.genres);
        const genreCount = readGenres.reduce((acc, genre) => {
            acc[genre] = (acc[genre] || 0) + 1;
            return acc;
        }, {});

        const favoriteGenres = Object.entries(genreCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([genre]) => genre);

        // Get books read by user to exclude from recommendations
        const readBookIds = userProgress.map(p => p.book._id);

        // Find books in favorite genres that user hasn't read
        const recommendations = await Book.find({
            _id: { $nin: readBookIds },
            genres: { $in: favoriteGenres },
            averageRating: { $gte: 3.5 }
        })
        .sort({ averageRating: -1, ratingsCount: -1 })
        .limit(10);

        res.json({
            recommendations,
            favoriteGenres,
            reason: 'Based on your reading history'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error getting recommendations', error: error.message });
    }
};