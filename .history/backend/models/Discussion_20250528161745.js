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
        }
})