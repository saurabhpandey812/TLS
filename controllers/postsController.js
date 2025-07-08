const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const { createPostService, getAllPostsService, getPostByIdService } = require('../services/postsService');

// Helper to format post response
function formatPost(post) {
  return {
    _id: post._id,
    user: post.user,
    caption: post.caption || '',
    media: Array.isArray(post.media) ? post.media : [],
    likesCount: typeof post.likesCount === 'number' ? post.likesCount : 0,
    commentsCount: typeof post.commentsCount === 'number' ? post.commentsCount : 0,
    status: post.status || 'published',
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

// Create a new post
exports.createPost = async (req, res) => {
  try {
    // If using file upload (from postController.js)
    if (req.files && req.files.length > 0) {
      const userId = req.user._id;
      const { caption } = req.body;
      if (req.files.length > 12) {
        return res.status(400).json({ success: false, message: 'You can upload up to 12 media files at once.' });
      }
      const mediaArr = [];
      for (const file of req.files) {
        const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';
        const uploadRes = await require('../services/cloudinary').uploadToCloudinary(file.path, resourceType);
        mediaArr.push({ url: uploadRes.secure_url, type: resourceType });
      }
      let post = await Post.create({
        user: userId,
        caption,
        media: mediaArr,
        status: 'published',
      });
      post = await post.populate('user', 'name username avatar');
      return res.status(201).json({ success: true, post: formatPost(post) });
    }
    // Else, use service-based creation
    const userId = req.user?._id;
    if (!userId) {
      console.error('No userId found in req.user');
      return res.status(400).json({ message: 'User not authenticated' });
    }
    const { content, images = [], video } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ message: 'Content is required' });
    }
    const result = await createPostService({ userId, content, images, video, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json({ success: true, post: formatPost(result.post) });
  } catch (err) {
    console.error('Error creating post:', err.stack || err);
    res.status(500).json({ message: 'Error creating post', error: err.message });
  }
};

// Get all posts (newest first, with user info, likes, comments)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 });
    const postsWithExtras = posts.map(formatPost);
    res.status(200).json({ success: true, posts: postsWithExtras });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch posts', error: error.message });
  }
};

// Get all posts by a specific user (newest first, with user info, likes, comments)
exports.getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ user: userId })
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 });
    const postsWithExtras = posts.map(formatPost);
    res.status(200).json({ success: true, posts: postsWithExtras });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user posts', error: error.message });
  }
};

// Get a single post by ID
exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId).populate('user', 'name username avatar');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, post: formatPost(post) });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching post', error: err.message });
  }
};

// Reshare a post
exports.resharePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id || req.params.postId;
    const result = await require('../services/postsService').resharePostService({ userId, postId, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error resharing post', error: err.message });
  }
}; 