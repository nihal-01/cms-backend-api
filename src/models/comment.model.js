const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    website: {
        type: String,
    },
    comment: {
        type: String,
        required: true,
        trim: true,
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
