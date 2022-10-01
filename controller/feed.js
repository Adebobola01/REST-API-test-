const express = require("express");
const { validationResult } = require("express-validator");
const Post = require("../models/post");
const path = require("path");
const User = require("../models/user");
const io = require("../socket");
const fs = require("fs");

exports.getPosts = async (req, res, next) => {
    const curPage = req.query.page || 1;
    const perPage = 3;
    try {
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
            .populate("creator")
            .sort({ createdAt: -1 })
            .skip((curPage - 1) * perPage)
            .limit(perPage);
        console.log("posts found");
        res.status(200).json({
            message: "Posts fetched successfully!",
            posts: posts,
            totalItems: totalItems,
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error("Validation failed, please enter a valid data");
        error.statusCode = 422;
        throw error;
    }

    if (!req.file) {
        const error = new Error("image not found!");
        error.statusCode = 422;
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path.split("");
    imageUrl.splice(6, 1, "/");
    const propImageUrl = imageUrl.join("");
    let creator;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: propImageUrl,
        creator: req.userId,
    });
    try {
        await post.save();
        const user = await User.findById(req.userId);
        creator = user;
        user.posts.push(post);
        await user.save();
        io.getIo().emit("posts", {
            action: "create",
            post: {
                ...post._doc,
                creator: { _id: req.userId, name: user.name },
            },
        });
        res.status(201).json({
            message: "post created successfully!",
            post: post,
            creator: { _id: creator.id, name: creator.name },
        });
    } catch (error) {
        next(error);
    }
};

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error("Could not find post");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            message: "post fetched successfully!",
            post: post,
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updatePost = async (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error("Validation failed, please enter a valid data");
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.body.image;

    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error("No file picked");
        error.statusCode = 422;
        throw error;
    }
    try {
        const post = await Post.findById(postId).populate("creator");
        if (!post) {
            const error = new Error("No post found!");
            error.statusCode = 404;
            throw error;
        }
        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        if (post.creator._Id.toString() !== req.userId) {
            const error = new Error("Not authenticated!");
            error.statusCode = 403;
            throw error;
        }
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        const result = await post.save();
        io.getIo().emit("posts", { action: "update", post: result });
        res.status(200).json({ message: "post updated", post: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error("No post found for this Id");
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.userId.toString() !== req.userId) {
            const error = new Error("Not authenticated!");
            error.statusCode = 403;
            throw error;
        }
        clearImage(postId);
        await Post.findByIdAndRemove(postId);

        const user = User.findById(req.userId);

        user.posts.pull(postId);
        await user.save();
        io.getIo().emit("Posts", { action: "delete", post: postId });
        res.status(201).json({ message: "post deleted successfully!" });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const clearImage = (filePath) => {
    filePath = path.join(__dirname, "..", filePath);
    fs.unlink(filePath, (err) => console.log(err));
};
