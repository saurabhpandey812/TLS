const Like = require('../models/Like');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const cloudinary = require('cloudinary').v2;
const { likePostService, unlikePostService, getPostLikesService, createPostService, addCommentService, deleteCommentService, likeCommentService, unlikeCommentService, addReplyService, deleteReplyService, resharePostService } = require('../services/postsService');

cloudinary.config({
  cloud_name: 'rits7275',
  api_key: '711285582753914',
  api_secret: 'c7-9frT8R24On200DG8QU86JFU0',
});

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
    let uploadedImages = [];
    let uploadedVideo = '';

    if (images && images.length > 0) {
      for (const img of images) {
        try {
          const uploadRes = await cloudinary.uploader.upload(img, {
            folder: 'tls-posts',
            resource_type: 'image',
          });
          uploadedImages.push(uploadRes.secure_url);
        } catch (cloudErr) {
          console.error('Cloudinary upload error:', cloudErr);
          return res.status(500).json({ message: 'Cloudinary upload failed', error: cloudErr.message });
        }
      }
    }

    // Upload video to Cloudinary if provided
    if (video) {
      try {
        const uploadRes = await cloudinary.uploader.upload(video, {
          folder: 'tls-posts',
          resource_type: 'video',
        });
        uploadedVideo = uploadRes.secure_url;
      } catch (cloudErr) {
        console.error('Cloudinary video upload error:', cloudErr);
        return res.status(500).json({ message: 'Cloudinary video upload failed', error: cloudErr.message });
      }
    }

    // Set both user and author fields for compatibility
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
    const query = userId ? { author: userId } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const posts = await Post.find(query)
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Post.countDocuments(query);
    res.json({ posts, total, page: parseInt(page), limit: parseInt(limit), hasMore: skip + posts.length < total });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching posts', error: err.message });
  }
};

// Get a single post by ID
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId).populate('author', 'name avatar');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    // Build a response object matching the frontend's expected structure
    const response = {
      _id: post._id,
      content: post.content,
      images: post.images || [],
      video: post.video || '',
      author: post.author ? {
        _id: post.author._id,
        name: post.author.name,
        avatar: post.author.avatar || ''
      } : null,
      likes: post.likes || [],
      comments: [], // Add comments if you have a comments model/field
      shares: post.shares || 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching post', error: err.message });
  }
};

// Get all comments for a post (with pagination)
exports.getComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const { page = 1, limit = 20 } = req.query;
    const post = await Post.findById(postId).populate('comments.author', 'name avatar');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    // Sort comments by createdAt ascending
    const sortedComments = post.comments.sort((a, b) => a.createdAt - b.createdAt);
    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit);
    const paginatedComments = sortedComments.slice(start, end);
    res.json({ comments: paginatedComments, total: post.comments.length });
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