const { validationResult } = require("express-validator");
const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [
            {
                _id: "1",
                title: "first post",
                content: "first post content!",
                imageUrl: "images/madara.png",
                creator: {
                    name: "Adebobola",
                },
                createdAt: Date.now(),
            },
        ],
    });
};

exports.createPost = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: "Validation failed, please enter a valid data",
            errors: errors.array(),
        });
    }

    const post = new Post({
        title: title,
        content: content,
        imageUrl: "/images/madara.png",
        creator: {
            name: "Adebobola",
        },
    });

    post.save()
        .then((result) => {
            res.status(201).json({
                message: "post created successfully",
                post: result,
            });
        })
        .catch((err) => {
            console.log(err);
        });
};
