const Post = require('../models/Post');
const { uploadToCloudinary } = require('../services/cloudinary');
const Profile = require('../models/Profile');

// Create a new post with multiple media uploads
const createPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { caption } = req.body;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one media file is required.' });
    }
    if (req.files.length > 12) {
      return res.status(400).json({ success: false, message: 'You can upload up to 12 media files at once.' });
    }
    const mediaArr = [];
    for (const file of req.files) {
      const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';
      const uploadRes = await uploadToCloudinary(file.path, resourceType);
      mediaArr.push({ url: uploadRes.secure_url, type: resourceType });
    }
    let post = await Post.create({
      user: userId,
      caption,
      media: mediaArr,
      status: 'published',
    });
    post = await post.populate('user', 'name username avatar');
    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create post', error: error.message });
  }
};

// Get all posts (newest first, with user info)
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch posts', error: error.message });
  }
};

// Get all posts by a specific user (newest first, with user info)
const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ user: userId })
      .populate('user', 'name username avatar')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user posts', error: error.message });
  }
};

module.exports = { createPost, getAllPosts, getPostsByUser }; 