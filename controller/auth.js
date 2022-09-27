const User = require("../models/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const e = require("express");
const jwt = require("jsonwebtoken");
const { json } = require("body-parser");

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error("validation failed");
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
            const user = new User({
                email: email,
                password: hashedPassword,
                name: name,
            });
            return user.save();
        })
        .then((result) => {
            res.status(201).json({
                message: "user created",
                userId: result._id,
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.getLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                const error = new Error(
                    "A user for this email could not be found!"
                );
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then((isEqual) => {
            if (!isEqual) {
                const error = new Error("Wrong password!");
                error.statusCode = 401;
                throw error;
            }

            const token = jwt.sign(
                {
                    exp: Math.floor(Date.now() / 1000) + 60 * 60,
                    email: loadedUser.email,
                    userId: loadedUser._id.toString(),
                },
                "theprivatekeyusedtosignthetoken"
            );
            res.status(200).json({
                token: token,
                userId: loadedUser._id.toString(),
            });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};
