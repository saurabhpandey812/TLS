const { likePostService, unlikePostService, getPostLikesService, likeCommentService, unlikeCommentService } = require('../services/likeService');

// Like a post
const likePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId || req.params.id;
    const result = await likePostService({ userId, postId, user: req.user, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to like post', error: error.message });
  }
};

// Unlike a post
const unlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId || req.params.id;
    const result = await unlikePostService({ userId, postId });
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unlike post', error: error.message });
  }
};

// Get all users who liked a post
const getLikesForPost = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    const result = await getPostLikesService(postId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch likes', error: error.message });
  }
};

// Like a comment
const likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;
    const result = await likeCommentService({ postId, commentId, userId, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to like comment', error: error.message });
  }
};

// Unlike a comment
const unlikeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;
    const result = await unlikeCommentService({ postId, commentId, userId });
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unlike comment', error: error.message });
  }
};

module.exports = { likePost, unlikePost, getLikesForPost, likeComment, unlikeComment }; 