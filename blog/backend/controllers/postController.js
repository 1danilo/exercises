const asyncHandler = require("express-async-handler");

// Get posts
// GET /api/posts
const getPosts = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "Get posts" });
});

// Set post
// SET /api/posts
const setPost = asyncHandler(async (req, res) => {
  if (!req.body.text) {
    res.status(400);
    throw new Error("Please add a text field");
  }
  res.status(200).json({ message: "Set post" });
});

// Update post
// UPDATE /api/posts/:id
const updatePost = asyncHandler(async (req, res) => {
  res.json({ message: `Update post ${req.params.id}` });
});

// Delete post
// DELETE /api/posts
const deletePost = asyncHandler(async (req, res) => {
  res.json({ message: `Delete post ${req.params.id}` });
});

module.exports = {
  getPosts,
  setPost,
  updatePost,
  deletePost,
};
