import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
        author : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User',
            required : true
        },
        content : {
            type : String,
            maxlenght : 2000,
            required : true
        },
        createdAt: {
          type: Date,
          default: Date.now
        },
        likes: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }]
      });

      const discussionSchema = new mongoose.Schema({
        book: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Book',
          required: true
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        content: {
          type: String,
          required: true,
          maxlength: 5000
        },
        category: {
          type: String,
          enum: ['general', 'spoiler', 'question', 'theory', 'recommendation'],
          default: 'general'
        },
        replies: [replySchema],
        likes: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }],
        views: {
          type: Number,
          default: 0
        },
        lastActivity: {
          type: Date,
          default: Date.now
        }
      }, {
        timestamps: true
      });
      
      // Update lastActivity when new reply is added
      discussionSchema.pre('save', function(next) {
        if (this.replies && this.replies.length > 0) {
          this.lastActivity = new Date();
        }
        next();
      });
      
      export default mongoose.model('Discussion', discussionSchema);