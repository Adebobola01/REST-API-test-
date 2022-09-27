const express = require("express");
const { validationResult } = require("express-validator");
const Post = require("../models/post");
const path = require("path");
const fs = require("fs");

exports.getPosts = (req, res, next) => {
    const curPage = req.query.page || 1;
    const perPage = 1;
    let totalItems;

    Post.find()
        .countDocuments()
        .then((count) => {
            totalItems = count;
            return Post.find()
                .skip((curPage - 1) * perPage)
                .limit(perPage);
        })
        .then((posts) => {
            console.log("posts found");
            res.status(200).json({
                message: "Posts fetched successfully!",
                posts: posts,
                totalItems: totalItems,
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.createPost = (req, res, next) => {
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
    const post = new Post({
        title: title,
        content: content,
        imageUrl: propImageUrl,
        creator: { name: "Adebobola" },
    });
    post.save()
        .then((result) => {
            res.status(201).json({
                message: "post created successfully!",
                post: result,
            });
        })
        .catch((err) => {
            next(err);
        });

    // post.save()
    //     .then((result) => {
    //         res.status(201).json({
    //             message: "post created successfully",
    //             post: result,
    //         });
    //     })
    //     .catch((err) => {
    //         if (!err.statusCode) {
    //             console.log(`database error => ${err}`);
    //             err.statusCode = 500;
    //         }
    //         next(err);
    //     });
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const error = new Error("Could not find post");
                error.statusCode = 404;
                throw error;
            }

            res.status(200).json({
                message: "post fetched successfully!",
                post: post,
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.updatePost = (req, res, next) => {
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
    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const error = new Error("No post found!");
                error.statusCode = 404;
                throw error;
            }
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.content = content;
            post.imageUrl = imageUrl;
            return post.save();
        })
        .then((result) => {
            res.status(200).json({ message: "post updated", post: result });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const error = new Error("No post found for this Id");
                error.statusCode = 404;
                throw error;
            }
            clearImage(postId);
            return Post.findByIdAndRemove(postId);
        })
        .then((result) => {
            res.status(201).json({ message: "post deleted successfully!" });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

const clearImage = (filePath) => {
    filePath = path.join(__dirname, "..", filePath);
    fs.unlink(filePath, (err) => console.log(err));
};
