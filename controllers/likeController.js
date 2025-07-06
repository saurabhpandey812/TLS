const Like = require('../models/Like');
const Post = require('../models/Post');

// Like a post
const likePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    const exists = await Like.findOne({ post: postId, user: userId });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Already liked.' });
    }
    await Like.create({ post: postId, user: userId });
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
    res.status(200).json({ success: true, message: 'Post liked.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to like post', error: error.message });
  }
};

// Unlike a post
const unlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    const deleted = await Like.findOneAndDelete({ post: postId, user: userId });
    if (!deleted) {
      return res.status(400).json({ success: false, message: 'Not liked yet.' });
    }
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
    res.status(200).json({ success: true, message: 'Post unliked.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unlike post', error: error.message });
  }
};

// Get all users who liked a post
const getLikesForPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const likes = await Like.find({ post: postId })
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, likes: likes.map(l => l.user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch likes', error: error.message });
  }
};

module.exports = { likePost, unlikePost, getLikesForPost }; 