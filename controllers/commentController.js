const Comment = require('../models/Comment');
const Post = require('../models/Post');

// Add a comment to a post
const addComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }
    await Comment.create({ post: postId, user: userId, text });
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
    res.status(201).json({ success: true, message: 'Comment added.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
};

// Get all comments for a post
const getCommentsForPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch comments', error: error.message });
  }
};

module.exports = { addComment, getCommentsForPost }; 