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
router.post("/posts", async (req, res) => {
  const post = new Post({
    author: req.params.author,
    title: req.body.name,
    text: req.body.text,
  });
  try {
    const 
  } catch (err)
});

//Updating one
router.patch("/:id", (req, res) => {});

//Deleting one

module.exports = router;
