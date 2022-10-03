const User = require("../models/user");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const Post = require("../models/post");
const jwt = require("jsonwebtoken");
const { clearImage } = require("../util/util");

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
        if (!req.isAuth) {
            const error = new Error("Not authenticated!");
            error.code = 401;
            throw error;
        }

        const errors = [];

        if (validator.isEmpty(postInput.title)) {
            errors.push({ message: "invalid title" });
        }
        if (
            validator.isEmpty(postInput.content) ||
            !validator.isLength(postInput.content, { min: 5 })
        ) {
            errors.push({ message: "content is too short" });
        }

        if (errors.length > 0) {
            const error = new Error("invalid input");
            error.code = 422;
            error.data = errors;
            throw error;
        }
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error("Invalid user!");
            error.code = 401;
            throw error;
        }
        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: user,
        });
        const createdPost = await post.save();
        user.posts.push(createdPost);
        await user.save();
        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString(),
        };
    },
    posts: async function ({ page }, req) {
        if (!isAuth) {
            const error = new Error("Not Authenticated!");
            error.code = 401;
            throw error;
        }
        const perPage = 2;
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
            .skip((page - 1) * perPage)
            .limit(perPage)
            .sort({ createdAt: -1 })
            .populate("creator");
        return {
            posts: posts.map((p) => {
                return {
                    ...p._doc,
                    id: p._id.toString(),
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString(),
                };
            }),
            totalPosts: totalPosts,
        };
    },
    post: async function ({ id }, req) {
        if (!isAuth) {
            const error = new Error("Not Authenticated!");
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(id).populate("creator");
        if (!post) {
            const error = new Error("post not found!");
            error.code = 404;
            throw error;
        }
        return {
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
        };
    },
    updatePost: async function ({ id, postInput }, req) {
        if (!isAuth) {
            const error = new Error("Not Authenticated!");
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(id).populate("creator");
        if (!post) {
            const error = new Error("Post not found!");
            error.code = 404;
            throw error;
        }
        if (req.userId.toString() !== post.creator._id.toString()) {
            const error = new Error("Not authorized");
            error.code = 403;
            throw error;
        }
        const errors = [];

        if (validator.isEmpty(postInput.title)) {
            errors.push({ message: "invalid title" });
        }
        if (
            validator.isEmpty(postInput.content) ||
            !validator.isLength(postInput.content, { min: 5 })
        ) {
            errors.push({ message: "content is too short" });
        }

        if (errors.length > 0) {
            const error = new Error("invalid input");
            error.code = 422;
            error.data = errors;
            throw error;
        }
        post.title = postInput.title;
        post.content = postInput.content;
        if (postInput.imageUrl !== "undefined") {
            post.imageUrl = postInput.imageUrl;
        }
        const updatedPost = await post.save();
        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString(),
        };
    },
    deletePost: async function ({ id }, req) {
        if (!isAuth) {
            const error = new Error("Not Authenticated!");
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(id);
        if (req.userId.toString() !== post.creator.toString()) {
            const error = new Error("Not authorized");
            error.code = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        await Post.findByIdAndDelete(id);
        const user = await User.findById(req.userId);
        user.posts.pull(id);
        return true;
    },
};
