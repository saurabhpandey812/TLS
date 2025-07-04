const Like = require('../models/Like');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const cloudinary = require('cloudinary').v2;

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

    // Check if already liked
    const existing = await Like.findOne({ user: userId, post: postId });
    if (existing) {
      return res.status(400).json({ message: 'Already liked' });
    }

    // Create like
    await Like.create({ user: userId, post: postId });
    // Update post's like count and likes array
    const post = await Post.findByIdAndUpdate(
      postId,
      { $addToSet: { likes: userId }, $inc: { likeCount: 1 } },
      { new: true }
    );

    // Notification (if not self-like)
    if (post && String(post.author) !== String(userId)) {
      // Check for existing unread notification for this like
      const existing = await Notification.findOne({
        recipient: post.author,
        sender: userId,
        type: 'like',
        'data.postId': postId,
        'data.likedBy': userId,
        isRead: false,
      });
      if (!existing) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: 'like',
          title: 'New Like',
          message: `${req.user.name || 'Someone'} liked your post`,
          data: { postId, likedBy: userId },
          isRead: false,
        });
      }
    }

    // Analytics log
    console.log(`User ${userId} liked post ${postId} at ${new Date().toISOString()}`);

    // Emit real-time event for post like
    const io = req.app.get('io');
    if (io) {
      const senderProfile = req.user;
      io.emit('new_post_like', {
        postId,
        userId,
        sender: {
          _id: senderProfile._id,
          name: senderProfile.name,
          avatar: senderProfile.avatar || '',
        },
      });
    }

    res.json({ message: 'Post liked', likeCount: post.likeCount });
  } catch (err) {
    res.status(500).json({ message: 'Error liking post', error: err.message });
  }
};

// Unlike a post
exports.unlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    // Remove like
    await Like.deleteOne({ user: userId, post: postId });
    // Update post's like count and likes array
    const post = await Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: userId }, $inc: { likeCount: -1 } },
      { new: true }
    );

    // Remove like notification
    await Notification.deleteOne({
      user: post.author,
      type: 'like',
      'data.postId': postId,
      'data.likedBy': userId,
    });

    // Analytics log
    console.log(`User ${userId} unliked post ${postId} at ${new Date().toISOString()}`);

    res.json({ message: 'Post unliked', likeCount: post.likeCount });
  } catch (err) {
    res.status(500).json({ message: 'Error unliking post', error: err.message });
  }
};

// Get all users who liked a post
exports.getPostLikes = async (req, res) => {
  try {
    const postId = req.params.id;
    const likes = await Like.find({ postId }).populate({
      path: 'userId',
      select: 'name avatar',
      model: Profile,
    });
    res.json({ likes });
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
    const post = await Post.create({
      user: userId,
      author: userId,
      content,
      images: uploadedImages,
      video: uploadedVideo,
    });

    // Populate author for real-time broadcast
    const populatedPost = await Post.findById(post._id).populate('author', 'name avatar');

    // Emit real-time event
    const io = req.app.get('io');
    if (io) io.emit('new_post', populatedPost);

    res.status(201).json({ message: 'Post created', post: populatedPost });
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
    const comment = { content, author: userId, createdAt: new Date() };
    const post = await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: comment } },
      { new: true }
    ).populate('comments.author', 'name avatar');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    // Create notification for post owner if commenter is not the owner
    if (String(post.user) !== String(userId)) {
      // Check for existing unread notification for this comment
      const existing = await Notification.findOne({
        recipient: post.user,
        sender: userId,
        type: 'comment',
        'data.postId': postId,
        'data.commentId': post.comments[post.comments.length - 1]._id,
        isRead: false,
      });
      if (!existing) {
        await Notification.create({
          recipient: post.user,
          sender: userId,
          type: 'comment',
          title: 'New Comment',
          message: `${req.user.name || 'Someone'} commented on your post: ${content}`,
          data: { postId, commentId: post.comments[post.comments.length - 1]._id },
          isRead: false,
        });
      }
    }
    const io = req.app.get('io');
    if (io && post.user) {
      // Populate sender details for socket payload
      const senderProfile = req.user;
      io.to(String(post.user)).emit('new_comment', {
        postId,
        comment: post.comments[post.comments.length - 1],
        post: { _id: post._id, content: post.content },
        sender: {
          _id: senderProfile._id,
          name: senderProfile.name,
          avatar: senderProfile.avatar || '',
        },
      });
    }
    res.status(201).json({ comment: post.comments[post.comments.length - 1] });
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
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    // Only author or admin can delete
    if (String(comment.author) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    comment.remove();
    await post.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting comment', error: err.message });
  }
};

// Like a comment
exports.likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.likes.includes(userId)) return res.status(400).json({ message: 'Already liked' });
    comment.likes.push(userId);
    await post.save();
    // Emit real-time event for comment like
    const io = req.app.get('io');
    if (io) io.emit('new_comment_like', { postId, commentId, userId });
    res.json({ likes: comment.likes });
  } catch (err) {
    res.status(500).json({ message: 'Error liking comment', error: err.message });
  }
};

// Unlike a comment
exports.unlikeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    comment.likes = comment.likes.filter(id => String(id) !== String(userId));
    await post.save();
    res.json({ likes: comment.likes });
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
    const post = await Post.findById(postId).populate('comments.author', 'name avatar');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const reply = { content, author: userId, createdAt: new Date(), likes: [] };
    comment.replies.push(reply);
    await post.save();
    // Create notification for comment author if replier is not the author
    if (String(comment.author) !== String(userId)) {
      const replyObj = comment.replies[comment.replies.length - 1];
      const existing = await Notification.findOne({
        recipient: comment.author,
        sender: userId,
        type: 'reply',
        'data.postId': postId,
        'data.commentId': commentId,
        'data.replyId': replyObj._id,
        isRead: false,
      });
      if (!existing) {
        await Notification.create({
          recipient: comment.author,
          sender: userId,
          type: 'reply',
          title: 'New Reply',
          message: `${req.user.name || 'Someone'} replied to your comment: ${replyObj.content}`,
          data: { postId, commentId, replyId: replyObj._id },
          isRead: false,
        });
      }
    }
    if (io) {
      const senderProfile = req.user;
      io.emit('new_reply', {
        postId,
        commentId,
        reply: comment.replies[comment.replies.length - 1],
        sender: {
          _id: senderProfile._id,
          name: senderProfile.name,
          avatar: senderProfile.avatar || '',
        },
      });
    }
    res.status(201).json({ reply: comment.replies[comment.replies.length - 1] });
  } catch (err) {
    res.status(500).json({ message: 'Error adding reply', error: err.message });
  }
};

// Delete a reply from a comment
exports.deleteReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
    const userId = req.user.profile || req.user._id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });
    if (String(reply.author) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }
    reply.remove();
    await post.save();
    res.json({ message: 'Reply deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting reply', error: err.message });
  }
}; 