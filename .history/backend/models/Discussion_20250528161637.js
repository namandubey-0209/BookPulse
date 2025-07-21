import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
        author : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User'
        }
})