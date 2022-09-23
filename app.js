const express = require("express");
const feedRoutes = require("./routes/feed");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const { default: mongoose } = require("mongoose");
require("dotenv").config();

app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
    next();
});
app.use("/feed", feedRoutes);

mongoose
    .connect(process.env.MongoDB_URI)
    .then((result) => {
        console.log("connected to database");
        app.listen(8080);
    })
    .catch((err) => {
        console.log(err);
    });
// app.listen(8080);
