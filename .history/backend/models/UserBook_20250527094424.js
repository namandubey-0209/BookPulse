import mongoose from "mongoose";

const userBookSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    book : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Book',
        required : true
    },
    status : {
        type :String,
        enum : ['want-to-read', 'currently-reading', 'completed', 'did-not-finish'],
        default : 'want-to-read'
    },

    //reading progress
    progess : {
        pagesRead : {
            type : Number ,
            default : 0,
            min : 0
        },
        percentage : {
            type :Number,
            default : 0,
            min : 0 ,
            max : 100
        }
    },

    //dates
    dateAddes : {
        type:Date,
        default : Date.now
    },
    startDate: Date,
    finishDate: Date,

    //User's perwsonal rating and reviews
    personalReview : {
        
    }
})