const User = require("../models/user");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const Post = require("../models/post");
const jwt = require("jsonwebtoken");

module.exports = {
    createUser: async function ({ userInput }, req) {
        const email = userInput.email;
        const password = userInput.password;
        const errors = [];
        if (!validator.isEmail(email)) {
            errors.push({ message: "invalid email" });
        }
        if (
            validator.isEmpty(password) ||
            !validator.isLength(password, { min: 5 })
        ) {
            errors.push({ message: "Password too short" });
        }

        if (errors.length > 0) {
            const error = new Error("invalid input");
            error.code = 422;
            error.data = errors;
            throw error;
        }
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            const error = new Error("user already exists!");
            error.statusCode = 401;
            throw error;
        }
        const hashedPw = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            password: hashedPw,
            name: userInput.name,
        });
        const createdUser = await user.save();
        return { ...createdUser._doc, _id: createdUser._id.toString() };
    },

    login: async function ({ email, password }) {
        const user = await User.findOne({ email: email });
        if (!user) {
            const error = new Error("User not found!");
            error.statusCode = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error("Password is incorrect!");
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email,
            },
            "theprivatekeyusedtosignthetoken",
            { expiresIn: "1h" }
        );

        return { token: token, userId: user._id.toString() };
    },

    createPost: async function ({ postInput }, req) {
        const errors = [];

        if (!validator.isEmail(postInput.title)) {
            errors.push({ message: "invalid email" });
        }
        if (
            validator.isEmpty(content) ||
            !validator.isLength(content, { min: 5 })
        ) {
            errors.push({ message: "content is too short" });
        }

        if (errors.length > 0) {
            const error = new Error("invalid input");
            error.code = 422;
            error.data = errors;
            throw error;
        }
        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
        });
        const createdPost = await post.save();
        return {...createdPost._doc, _id: createdPost._id.toString(), createdAt: createdPost.createdAt.toISOString(), updatedAt: createdPost.updatedAt.toISOString()}
    },
};
