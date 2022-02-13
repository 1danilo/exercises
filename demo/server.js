require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");

mongoose.connect(process.env.DATABASE_URL);

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const postsRouter = require("./routes/posts");
app.use("/posts", postsRouter);

app.listen(3000, () => console.log("Server Started"));
