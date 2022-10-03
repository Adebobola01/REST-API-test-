const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolver");
const { graphqlHTTP } = require("express-graphql");
const mongoose = require("mongoose");
require("dotenv").config();
const auth = require("./middleware/auth");

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
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(auth);

app.use(
    "/graphql",
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolver,
        graphiql: true,
        formatError(err) {
            if (!err.originalError) {
                return err;
            }
            const data = err.originalError.data;
            const message = err.message || "An error occured";
            const code = err.originalError.code;
            return { message: message, status: code, data: data };
        },
    })
);

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
        app.listen(8080);
    })
    .catch((err) => {
        console.log(err);
    });
// app.listen(8080);
