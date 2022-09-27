const express = require("express");
const router = express.Router();
const { check, body } = require("express-validator");
const authController = require("../controller/auth");
const User = require("../models/user");

router.put(
    "/signup",
    [
        body("email")
            .trim()
            .isEmail()
            .withMessage("Please enter a valid email!")
            .normalizeEmail()
            .custom((value, { req }) => {
                return User.findOne({ email: value }).then((userDoc) => {
                    if (userDoc) {
                        return Promise.reject("Email address already exists!");
                    }
                });
            }),
        body("password").trim().isLength({ min: 5 }),
        body("name").trim().not().isEmpty(),
    ],
    authController.signup
);
router.post("/login", authController.getLogin);

module.exports = router;
