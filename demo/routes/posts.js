const express = require("express");
const router = express.Router();
const Post = require("../models/post");

//Getting all
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Getting one
router.get("/:id", (req, res) => {
  res.send(req.params.id);
});

//Creating one
router.post("/", async (req, res) => {
  const post = new Post({
    author: req.body.author,
    title: req.body.title,
    text: req.body.text,
  });
  try {
    const newPost = await post.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//Updating one
router.patch("/:id", (req, res) => {});

//Deleting one

module.exports = router;
