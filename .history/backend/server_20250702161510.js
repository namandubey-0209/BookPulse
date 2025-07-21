import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/books.js';
import userRoutes from './routes/users.js';
import readingProgressRoutes from './routes/reading_progress.js';
import discussionRoutes from './routes/discussions.js';
import reviewRoutes from './routes/reviews.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' })); // Allow requests from frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.use('/api/auth',authRoutes)
app.use('/api/books',bookRoutes)
app.use('/api/users',userRoutes)
app.use('/api/reading_progress',require('./routes/reading_progress.js'))
app.use('/api/discussions',require('./routes/discussions.js'))
app.use('/api/reviews',require('./routes/reviews.js'))


// 404 Catch-All route (must be last)
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
