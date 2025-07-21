import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({

    openLibraryId: {
        type: String,
        required: true,
        unique: true
      },
      title: {
        type: String,
        required: true,
        trim: true
      },
      authors: [{
        name: String,
        key: String // Open Library author key
      }],
      isbn: {
        isbn10: String,
        isbn13: String
      },
      coverImage: {
        small: String,
        medium: String,
        large: String
      },
      description: {
        type: String,
        default: ''
      },
      subjects: [String], // genres/topics
      pageCount: {
        type: Number,
        default: 0
      },
      publishDate: String,
      publisher: String,
      language: {
        type: String,
        default: 'en'
      },
      
      // App-specific data
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalRatings: {
        type: Number,
        default: 0
      },
      totalReviews: {
        type: Number,
        default: 0
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    }, {
      timestamps: true
    });
    
    // Index for searching
    bookSchema.index({ 
      title: 'text', 
      'authors.name': 'text',
      subjects: 'text',
      description: 'text'
    });
    
    export default mongoose.model('Book', bookSchema);