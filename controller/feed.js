const express = require("express");
const { validationResult } = require("express-validator");
const Post = require("../models/post");
const path = require("path");
const User = require("../models/user");
const fs = require("fs");

exports.getPosts = async (req, res, next) => {
    const curPage = req.query.page || 1;
    const perPage = 3;
    try {
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
            .skip((curPage - 1) * perPage)
            .limit(perPage);
        console.log("posts found");
        res.status(200).json({
            message: "Posts fetched successfully!",
            posts: posts,
            totalItems: totalItems,
        });
    } catch (error) {
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
        await user.posts.push(post);
        await user.save();
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
    } catch (error) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updatePost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error(
                "Validation failed, please enter a valid data"
            );
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
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error("No post found!");
            error.statusCode = 404;
            throw error;
        }
        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        if (post.creator.userId.toString() !== req.userId) {
            const error = new Error("Not authenticated!");
            error.statusCode = 403;
            throw error;
        }
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        await post.save();

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

        res.status(201).json({ message: "post deleted successfully!" });
    } catch (error) {
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
