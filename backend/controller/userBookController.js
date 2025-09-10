import mongoose from 'mongoose'
import UserBook from '../models/UserBook.js'
import Book from '../models/Book.js'
import openLibraryService from '../services/openLibraryService.js'
import ReadingProgress from '../models/ReadingProgress.js'


export const getUserBooks = async (req, res) => {
  try {
    const { userId } = req.params
    const { status, page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query

    const query = { user: userId }
    if (status && status !== 'all') query.status = status

    const userBooks = await UserBook.find(query)
      .populate('book', 'title authors coverImage pageCount subjects averageRating totalRatings publishDate')
      .populate('user', 'username')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    const total = await UserBook.countDocuments(query)

    res.json({
      books: userBooks,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user books', error: error.message })
  }
}

export const getUserBook = async (req, res) => {
  try {
    const { userBookId } = req.params
    const userBook = await UserBook.findOne({ _id: userBookId, user: req.user.id })
      .populate('book', 'title authors coverImage pageCount subjects averageRating totalRatings description publishDate')
      .populate('user', 'username')

    if (!userBook) return res.status(404).json({ message: 'Book not found on your shelf' })

    res.json({ userBook })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user book', error: error.message })
  }
}

export const addBookToShelf = async (req, res) => {
  try {
    const { bookId, status = 'want-to-read', notes = '' } = req.body
    const userId = req.user.id

    if (!bookId) return res.status(400).json({ message: 'Book ID is required' })

    const book = await Book.findById(bookId)
    if (!book) return res.status(404).json({ message: 'Book not found' })

    const existing = await UserBook.findOne({ user: userId, book: bookId })
    if (existing) return res.status(400).json({ message: 'Book already on your shelf' })

    const userBook = new UserBook({
      user: userId,
      book: bookId,
      status,
      dateAdded: new Date(),
      personalReview: { content: notes, isPublic: false }
    })

    if (status === 'currently-reading') userBook.startDate = new Date()

    await userBook.save()
    await userBook.populate('book', 'title authors coverImage pageCount subjects averageRating')
    await userBook.populate('user', 'username')

    res.status(201).json({ message: 'Book added to shelf successfully', userBook })
  } catch (error) {
    res.status(500).json({ message: 'Error adding book to shelf', error: error.message })
  }
}

export const updateBookStatus = async (req, res) => {
  try {
    const { userBookId } = req.params
    const { status, notes, isPublic } = req.body

    const userBook = await UserBook.findOne({ _id: userBookId, user: req.user.id })
    if (!userBook) return res.status(404).json({ message: 'Book not found on your shelf' })

    if (status) {
      userBook.status = status
      if (status === 'currently-reading' && !userBook.startDate) userBook.startDate = new Date()
      else if (status === 'completed' && !userBook.finishDate) {
        userBook.finishDate = new Date()
        if (!userBook.startDate) userBook.startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      } else if (status === 'want-to-read') {
        userBook.startDate = null
        userBook.finishDate = null
        userBook.progress.pagesRead = 0
        userBook.progress.percentage = 0
      }
    }

    if (notes !== undefined) {
      userBook.personalReview.content = notes
      if (notes) userBook.personalReview.dateWritten = new Date()
    }

    if (isPublic !== undefined) userBook.personalReview.isPublic = isPublic

    await userBook.save()
    await userBook.populate('book', 'title authors coverImage pageCount subjects averageRating')
    await userBook.populate('user', 'username')

    res.json({ message: 'Book updated successfully', userBook })
  } catch (error) {
    res.status(500).json({ message: 'Error updating book', error: error.message })
  }
}

export const updateReadingProgress = async (req, res) => {
  try {
    const { userBookId } = req.params
    const { pagesRead, notes } = req.body

    const userBook = await UserBook.findOne({ _id: userBookId, user: req.user.id })
    if (!userBook) return res.status(404).json({ message: 'Book not found on your shelf' })

    if (pagesRead !== undefined) {
      userBook.progress.pagesRead = Math.max(0, pagesRead)

      const book = await Book.findById(userBook.book)
      if (book && book.pageCount > 0) {
        userBook.progress.percentage = Math.min(
          Math.round((userBook.progress.pagesRead / book.pageCount) * 100),
          100
        )
      }

      if (book && userBook.progress.pagesRead >= book.pageCount && userBook.status !== 'completed') {
        userBook.status = 'completed'
        userBook.finishDate = new Date()
      }
    }

    if (notes) {
      userBook.personalReview.content = notes
      userBook.personalReview.dateWritten = new Date()
    }

    await userBook.save()
    await userBook.populate('book', 'title authors coverImage pageCount subjects averageRating')

    res.json({ message: 'Reading progress updated successfully', userBook })
  } catch (error) {
    res.status(500).json({ message: 'Error updating reading progress', error: error.message })
  }
}

export const addReadingSession = async (req, res) => {
  try {
    const { userBookId } = req.params
    const { pagesRead = 0, timeSpent = 0, notes = '' } = req.body

    const userBook = await UserBook.findOne({ _id: userBookId, user: req.user.id })
    if (!userBook) return res.status(404).json({ message: 'Book not found on your shelf' })

    userBook.readingSessions.push({
      date: new Date(),
      pagesRead: Math.max(0, pagesRead),
      timeSpent: Math.max(0, timeSpent),
      notes
    })

    userBook.progress.pagesRead += pagesRead

    const book = await Book.findById(userBook.book)
    if (book && book.pageCount > 0) {
      userBook.progress.percentage = Math.min(
        Math.round((userBook.progress.pagesRead / book.pageCount) * 100),
        100
      )
    }

    if (userBook.status === 'want-to-read' && pagesRead > 0) {
      userBook.status = 'currently-reading'
      userBook.startDate = new Date()
    }

    if (book && userBook.progress.pagesRead >= book.pageCount && userBook.status !== 'completed') {
      userBook.status = 'completed'
      userBook.finishDate = new Date()
    }

    await userBook.save()
    await userBook.populate('book', 'title authors coverImage pageCount subjects averageRating')

    res.json({ message: 'Reading session added successfully', userBook })
  } catch (error) {
    res.status(500).json({ message: 'Error adding reading session', error: error.message })
  }
}

export const removeBookFromShelf = async (req, res) => {
  try {
    const { userBookId } = req.params

    const userBook = await UserBook.findOneAndDelete({ _id: userBookId, user: req.user.id })

    if (!userBook) return res.status(404).json({ message: 'Book not found on your shelf' })

    res.json({ message: 'Book removed from shelf successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error removing book from shelf', error: error.message })
  }
}

export const getReadingStats = async (req, res) => {
  try {
    const { userId } = req.params
    const { year = new Date().getFullYear() } = req.query

    const startDate = new Date(`${year}-01-01`)
    const endDate = new Date(`${year + 1}-01-01`)

    const statusStats = await UserBook.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), dateAdded: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalPages: { $sum: '$progress.pagesRead' } } }
    ])

    const sessionStats = await UserBook.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), 'readingSessions.0': { $exists: true } } },
      { $unwind: '$readingSessions' },
      { $match: { 'readingSessions.date': { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalTimeSpent: { $sum: '$readingSessions.timeSpent' },
          totalPagesInSessions: { $sum: '$readingSessions.pagesRead' }
        }
      }
    ])

    const recentSessions = await UserBook.find({
      user: userId,
      'readingSessions.0': { $exists: true }
    }).select('readingSessions')

    let streak = 0
    const today = new Date()
    const sessionDates = new Set()

    recentSessions.forEach(ub =>
      ub.readingSessions.forEach(session =>
        sessionDates.add(new Date(session.date).toDateString())
      )
    )

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      if (sessionDates.has(checkDate.toDateString())) streak++
      else if (i > 0) break
    }

    res.json({
      year: parseInt(year),
      booksFinished: statusStats.find(s => s._id === 'completed')?.count || 0,
      booksReading: statusStats.find(s => s._id === 'currently-reading')?.count || 0,
      booksToRead: statusStats.find(s => s._id === 'want-to-read')?.count || 0,
      booksDidNotFinish: statusStats.find(s => s._id === 'did-not-finish')?.count || 0,
      totalPages: statusStats.reduce((sum, s) => sum + (s.totalPages || 0), 0),
      readingStreak: streak,
      totalReadingSessions: sessionStats[0]?.totalSessions || 0,
      totalTimeSpent: sessionStats[0]?.totalTimeSpent || 0,
      averageSessionLength: sessionStats[0]?.totalSessions
        ? Math.round(sessionStats[0].totalTimeSpent / sessionStats[0].totalSessions)
        : 0,
      statusBreakdown: statusStats
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reading stats', error: error.message })
  }
}

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id
    const userProgress = await ReadingProgress.find({ user: userId, status: { $in: ['completed', 'reading'] } }).populate('book')

    if (!userProgress.length) {
      const popularBooks = await Book.find({}).sort({ ratingsCount: -1, averageRating: -1 }).limit(10)
      return res.json({ recommendations: popularBooks, reason: 'Popular books' })
    }

    const readIds = userProgress.map(p => p.book._id)
    const genres = userProgress.flatMap(p => p.book.genres)
    const topGenres = Object.entries(genres.reduce((a, g) => ((a[g] = (a[g] || 0) + 1), a), {}))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g)

    const recommendations = await Book.find({
      _id: { $nin: readIds },
      genres: { $in: topGenres },
      averageRating: { $gte: 3.5 }
    }).sort({ averageRating: -1, ratingsCount: -1 }).limit(10)

    res.json({ recommendations, favoriteGenres: topGenres, reason: 'Based on your history' })
  } catch (error) {
    res.status(500).json({ message: 'Error getting recommendations', error: error.message })
  }
}

export const getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, author, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
    const query = {}
    if (genre) query.genres = genre
    if (author) query.authors = author
    if (search) query.$text = { $search: search }

    const books = await Book.find(query)
      .populate('addedBy', 'username')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(+limit)

    const total = await Book.countDocuments(query)

    res.json({ books, totalPages: Math.ceil(total / limit), currentPage: +page, total })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books', error: error.message })
  }
}

export const getBookDetails = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId).populate('addedBy', 'username')
    if (!book) return res.status(404).json({ message: 'Book not found' })

    const userProgress = await ReadingProgress.findOne({
      user: req.user.id,
      book: book._id
    })

    res.json({ book, userProgress })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching book details', error: error.message })
  }
}

export const addBook = async (req, res) => {
  const bookData = { ...req.body, addedBy: req.user.id }

  try {
    let book = await Book.findOne({
      $or: [
        { openLibraryId: bookData.openLibraryId },
        { isbn: bookData.isbn },
        { title: bookData.title, authors: { $in: bookData.authors } }
      ]
    })

    if (book) return res.json({ message: 'Book already exists', book })

    book = new Book(bookData)
    await book.save()

    res.status(201).json({ message: 'Book added', book })
  } catch (error) {
    res.status(500).json({ message: 'Error adding book', error: error.message })
  }
}

export const searchBooks = async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query

  if (!q) return res.status(400).json({ message: 'Search query is required' })

  try {
    const books = await openLibraryService.searchBooks(q, page, limit)
    res.json(books)
  } catch (error) {
    res.status(500).json({ message: 'Error searching books', error: error.message })
  }
}
