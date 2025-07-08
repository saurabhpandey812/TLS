const Like = require('../models/Like');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const { likePostService, unlikePostService, getPostLikesService, createPostService, addCommentService, deleteCommentService, likeCommentService, unlikeCommentService, addReplyService, deleteReplyService, resharePostService, getAllPostsService, getPostByIdService, getCommentsService } = require('../services/postsService');

// Like a post
exports.likePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;
    const result = await likePostService({ userId, postId, user: req.user, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error liking post', error: err.message });
  }
};

// Unlike a post
exports.unlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;
    const result = await unlikePostService({ userId, postId });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error unliking post', error: err.message });
  }
};

// Get all users who liked a post
exports.getPostLikes = async (req, res) => {
  try {
    const postId = req.params.id;
    const result = await getPostLikesService(postId);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching likes', error: err.message });
  }
};

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      console.error('No userId found in req.user');
      return res.status(400).json({ message: 'User not authenticated' });
    }
    const { content, images = [], video } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ message: 'Content is required' });
    }
    // Move all upload logic to the service
    const result = await createPostService({ userId, content, images, video, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json(result);
  } catch (err) {
    console.error('Error creating post:', err.stack || err);
    res.status(500).json({ message: 'Error creating post', error: err.message });
  }
};

// Get all posts (latest first)
exports.getAllPosts = async (req, res) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;
    const result = await getAllPostsService({ userId, page, limit });
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching posts', error: err.message });
  }
};

// Get a single post by ID
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const result = await getPostByIdService(postId);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching post', error: err.message });
  }
};

// Get all comments for a post (with pagination)
exports.getComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const { page = 1, limit = 20 } = req.query;
    const result = await getCommentsService({ postId, page, limit });
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;
    const userId = req.user.profile || req.user._id; // support both Profile and User
    if (!content || !userId) return res.status(400).json({ message: 'Content and user required' });
    const result = await addCommentService({ postId, content, userId, user: req.user, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message });
  }
};

// Delete a comment from a post
exports.deleteComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentId = req.params.commentId;
    const userId = req.user.profile || req.user._id;
    const result = await deleteCommentService({ postId, commentId, userId });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error deleting comment', error: err.message });
  }
};

// Like a comment
exports.likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;
    const result = await likeCommentService({ postId, commentId, userId, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error liking comment', error: err.message });
  }
};

// Unlike a comment
exports.unlikeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;
    const result = await unlikeCommentService({ postId, commentId, userId });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error unliking comment', error: err.message });
  }
};

// Add a reply to a comment
exports.addReply = async (req, res) => {
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
exports.deleteReply = async (req, res) => {
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

// Reshare a post
exports.resharePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;
    const result = await resharePostService({ userId, postId, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error resharing post', error: err.message });
  }
}; 