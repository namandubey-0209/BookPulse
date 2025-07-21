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
    status
})