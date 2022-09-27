const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
    email: {
        type: String,
        require: true,
    },
    password: {
        type: String,
        require: true,
    },
    name: {
        type: String,
        require: true,
    },
    status: {
        type: String,
        require: true,
    },
    posts: [
        {
            type: Schema.Types.ObjectId,
            ref: "Post",
        },
    ],
});

module.exports = mongoose.model("User", userSchema);
