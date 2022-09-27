const express = require("express");
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
// const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(bodyParser.json());
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, GET, OPTIONS, PUT, DELETE, PATCH"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
    next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

mongoose
    .connect(process.env.MongoDB_URI)
    .then((result) => {
        console.log("connected to database");
        const httpServer = app.listen(8080);
        const io = require("./socket").init(httpServer);
        io.on("connection", (socket) => {
            console.log("client connected!");
        });
    })
    .catch((err) => {
        console.log(err);
    });
// app.listen(8080);
