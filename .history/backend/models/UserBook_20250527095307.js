import mongoose from "mongoose";

const userBookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  status: {
    type: String,
    enum: ['want-to-read', 'currently-reading', 'completed', 'did-not-finish'],
    default: 'want-to-read'
  },

  // Reading progress
  progress: { 
    pagesRead: {
      type: Number,
      default: 0,
      min: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Dates
  dateAdded: { 
    type: Date,
    default: Date.now
  },
  startDate: Date,
  finishDate: Date,

  // User's personal rating and reviews
  personalReview: { 
    content: String,
    isPublic: {
      type: Boolean,
      default: true
    },
    dateWritten: Date
  },

  // Reading sessions for tracking
  readingSessions: [{
    date: {
      type: Date,
      default: Date.now
    },
    pagesRead: Number,
    timeSpent: Number
  }]
}, {
  timestamps: true
});

// to ensure one record per user-book
userBookSchema.index({user : 1 , book : 1}, { unique : true});

//to calculate percentage
userBookSchema.pre('save',function(next){
    if(this.book && this.book.pageCount && this.book.pa)
})
