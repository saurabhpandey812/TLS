const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { addCommentService, deleteCommentService, addReplyService, deleteReplyService, getCommentsService } = require('../services/postsService');

// Add a comment to a post
const addComment = async (req, res) => {
  try {
    const postId = req.params.id || req.params.postId;
    const { content } = req.body;
    const userId = req.user.profile || req.user._id;
    if (!content || !userId) return res.status(400).json({ message: 'Content and user required' });
    const result = await addCommentService({ postId, content, userId, user: req.user, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
};

// Get all comments for a post (with pagination)
const getCommentsForPost = async (req, res) => {
  try {
    const postId = req.params.id || req.params.postId;
    const { page = 1, limit = 20 } = req.query;
    const result = await getCommentsService({ postId, page, limit });
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
};

// Delete a comment from a post
const deleteComment = async (req, res) => {
  try {
    const postId = req.params.id || req.params.postId;
    const commentId = req.params.commentId;
    const userId = req.user.profile || req.user._id;
    const result = await deleteCommentService({ postId, commentId, userId });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error deleting comment', error: err.message });
  }
};

// Add a reply to a comment
const addReply = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.profile || req.user._id;
    if (!content || !userId) return res.status(400).json({ message: 'Content and user required' });
    const result = await addReplyService({ postId, commentId, content, userId, user: req.user, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error adding reply', error: err.message });
  }
};

// Delete a reply from a comment
const deleteReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
    const userId = req.user.profile || req.user._id;
    const result = await deleteReplyService({ postId, commentId, replyId, userId });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error deleting reply', error: err.message });
  }
};

module.exports = { addComment, getCommentsForPost, deleteComment, addReply, deleteReply }; 