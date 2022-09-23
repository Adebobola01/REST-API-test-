const express = require("express");
const router = express.Router();
const { check, body } = require("express-validator");
const feedController = require("../controller/feed");

router.get("/posts", feedController.getPosts);
router.post(
    "/post",
    [
        body("title").trim().isLength({ min: 5 }),
        body("content").trim().isLength({ min: 5 }),
    ],
    feedController.createPost
);

module.exports = router;
