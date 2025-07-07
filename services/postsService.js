const Like = require('../models/Like');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { createNotification } = require('../utils/notificationHelpers');

async function likePostService({ userId, postId, user, io }) {
  const existing = await Like.findOne({ user: userId, post: postId });
  if (existing) {
    return { success: false, message: 'Already liked' };
  }
  await Like.create({ user: userId, post: postId });
  const post = await Post.findByIdAndUpdate(
    postId,
    { $addToSet: { likes: userId }, $inc: { likeCount: 1 } },
    { new: true }
  );
  if (post && String(post.author) !== String(userId)) {
    const existingNotif = await Notification.findOne({
      recipient: post.author,
      sender: userId,
      type: 'like',
      'data.postId': postId,
      'data.likedBy': userId,
      isRead: false,
    });
    if (!existingNotif) {
      await Notification.create({
        recipient: post.author,
        sender: userId,
        type: 'like',
        title: 'New Like',
        message: `${user?.name || 'Someone'} liked your post`,
        data: { postId, likedBy: userId },
        isRead: false,
      });
    }
  }
  if (io) {
    io.emit('new_post_like', {
      postId,
      userId,
      sender: {
        _id: user?._id,
        name: user?.name,
        avatar: user?.avatar || '',
      },
    });
  }
  return { success: true, message: 'Post liked', likeCount: post.likeCount };
}

async function unlikePostService({ userId, postId }) {
  await Like.deleteOne({ user: userId, post: postId });
  const post = await Post.findByIdAndUpdate(
    postId,
    { $pull: { likes: userId }, $inc: { likeCount: -1 } },
    { new: true }
  );
  await Notification.deleteOne({
    user: post.author,
    type: 'like',
    'data.postId': postId,
    'data.likedBy': userId,
  });
  return { success: true, message: 'Post unliked', likeCount: post.likeCount };
}

async function getPostLikesService(postId) {
  const likes = await Like.find({ postId }).populate({
    path: 'userId',
    select: 'name avatar',
    model: Profile,
  });
  return { success: true, likes };
}

async function createPostService({ userId, content, images = [], video, io }) {
  if (!content || typeof content !== 'string') {
    return { success: false, message: 'Content is required' };
  }
  let uploadedImages = [];
  let uploadedVideo = '';
  if (images && images.length > 0) {
    for (const img of images) {
      const url = await uploadToCloudinary(img, 'tls-posts', 'image');
      uploadedImages.push(url);
    }
  }
  if (video) {
    uploadedVideo = await uploadToCloudinary(video, 'tls-posts', 'video');
  }
  const post = await Post.create({
    user: userId,
    author: userId,
    content,
    images: uploadedImages,
    video: uploadedVideo,
  });
  const populatedPost = await Post.findById(post._id).populate('author', 'name avatar');
  if (io) io.emit('new_post', populatedPost);
  return { success: true, message: 'Post created', post: populatedPost };
}

async function addCommentService({ postId, content, userId, user, io }) {
  if (!content || !userId) return { success: false, message: 'Content and user required' };
  const comment = { content, author: userId, createdAt: new Date() };
  const post = await Post.findByIdAndUpdate(
    postId,
    { $push: { comments: comment } },
    { new: true }
  ).populate('comments.author', 'name avatar');
  if (!post) return { success: false, message: 'Post not found' };
  if (String(post.user) !== String(userId)) {
    const lastComment = post.comments[post.comments.length - 1];
    const existing = await Notification.findOne({
      recipient: post.user,
      sender: userId,
      type: 'comment',
      'data.postId': postId,
      'data.commentId': lastComment._id,
      isRead: false,
    });
    if (!existing) {
      await Notification.create({
        recipient: post.user,
        sender: userId,
        type: 'comment',
        title: 'New Comment',
        message: `${user?.name || 'Someone'} commented on your post: ${content}`,
        data: { postId, commentId: lastComment._id },
        isRead: false,
      });
    }
  }
  if (io && post.user) {
    const senderProfile = user;
    io.to(String(post.user)).emit('new_comment', {
      postId,
      comment: post.comments[post.comments.length - 1],
      post: { _id: post._id, content: post.content },
      sender: {
        _id: senderProfile?._id,
        name: senderProfile?.name,
        avatar: senderProfile?.avatar || '',
      },
    });
  }
  return { success: true, comment: post.comments[post.comments.length - 1] };
}

async function deleteCommentService({ postId, commentId, userId }) {
  const post = await Post.findById(postId);
  if (!post) return { success: false, message: 'Post not found' };
  const comment = post.comments.id(commentId);
  if (!comment) return { success: false, message: 'Comment not found' };
  if (String(comment.author) !== String(userId)) {
    return { success: false, message: 'Not authorized to delete this comment' };
  }
  comment.remove();
  await post.save();
  return { success: true, message: 'Comment deleted' };
}

async function likeCommentService({ postId, commentId, userId, io }) {
  const post = await Post.findById(postId);
  if (!post) return { success: false, message: 'Post not found' };
  const comment = post.comments.id(commentId);
  if (!comment) return { success: false, message: 'Comment not found' };
  if (comment.likes.includes(userId)) return { success: false, message: 'Already liked' };
  comment.likes.push(userId);
  await post.save();
  if (io) io.emit('new_comment_like', { postId, commentId, userId });
  return { success: true, likes: comment.likes };
}

async function unlikeCommentService({ postId, commentId, userId }) {
  const post = await Post.findById(postId);
  if (!post) return { success: false, message: 'Post not found' };
  const comment = post.comments.id(commentId);
  if (!comment) return { success: false, message: 'Comment not found' };
  comment.likes = comment.likes.filter(id => String(id) !== String(userId));
  await post.save();
  return { success: true, likes: comment.likes };
}

async function addReplyService({ postId, commentId, content, userId, user, io }) {
  if (!content || !userId) return { success: false, message: 'Content and user required' };
  const post = await Post.findById(postId).populate('comments.author', 'name avatar');
  if (!post) return { success: false, message: 'Post not found' };
  const comment = post.comments.id(commentId);
  if (!comment) return { success: false, message: 'Comment not found' };
  const reply = { content, author: userId, createdAt: new Date(), likes: [] };
  comment.replies.push(reply);
  await post.save();
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
        message: `${user?.name || 'Someone'} replied to your comment: ${replyObj.content}`,
        data: { postId, commentId, replyId: replyObj._id },
        isRead: false,
      });
    }
  }
  if (io) {
    const senderProfile = user;
    io.emit('new_reply', {
      postId,
      commentId,
      reply: comment.replies[comment.replies.length - 1],
      sender: {
        _id: senderProfile?._id,
        name: senderProfile?.name,
        avatar: senderProfile?.avatar || '',
      },
    });
  }
  return { success: true, reply: comment.replies[comment.replies.length - 1] };
}

async function deleteReplyService({ postId, commentId, replyId, userId }) {
  const post = await Post.findById(postId);
  if (!post) return { success: false, message: 'Post not found' };
  const comment = post.comments.id(commentId);
  if (!comment) return { success: false, message: 'Comment not found' };
  const reply = comment.replies.id(replyId);
  if (!reply) return { success: false, message: 'Reply not found' };
  if (String(reply.author) !== String(userId)) {
    return { success: false, message: 'Not authorized to delete this reply' };
  }
  reply.remove();
  await post.save();
  return { success: true, message: 'Reply deleted' };
}

async function resharePostService({ userId, postId, io }) {
  // Find the original post
  const originalPost = await Post.findById(postId);
  if (!originalPost) {
    return { success: false, message: 'Original post not found' };
  }
  // Create a new post as a reshare
  const reshare = await Post.create({
    user: userId,
    author: userId,
    content: originalPost.content,
    images: originalPost.images,
    video: originalPost.video,
    isReshare: true,
    originalPost: originalPost._id,
  });
  // Increment reshare count on the original post
  originalPost.reshareCount = (originalPost.reshareCount || 0) + 1;
  await originalPost.save();
  // Optionally emit a socket event
  if (io) io.emit('new_reshare', { postId: originalPost._id, reshareId: reshare._id, userId });
  return { success: true, message: 'Post reshared', post: reshare };
}

async function getAllPostsService({ userId, page = 1, limit = 20 }) {
  const query = userId ? { author: userId } : {};
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const posts = await Post.find(query)
    .populate('author', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  const total = await Post.countDocuments(query);
  return {
    success: true,
    posts,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    hasMore: skip + posts.length < total
  };
}

async function getPostByIdService(postId) {
  const post = await Post.findById(postId).populate('author', 'name avatar');
  if (!post) {
    return { success: false, message: 'Post not found' };
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
  return { success: true, post: response };
}

async function getCommentsService({ postId, page = 1, limit = 20 }) {
  const post = await Post.findById(postId).populate('comments.author', 'name avatar');
  if (!post) return { success: false, message: 'Post not found' };
  // Sort comments by createdAt ascending
  const sortedComments = post.comments.sort((a, b) => a.createdAt - b.createdAt);
  const start = (parseInt(page) - 1) * parseInt(limit);
  const end = start + parseInt(limit);
  const paginatedComments = sortedComments.slice(start, end);
  return { success: true, comments: paginatedComments, total: post.comments.length };
}

module.exports = {
  likePostService,
  unlikePostService,
  getPostLikesService,
  createPostService,
  addCommentService,
  deleteCommentService,
  likeCommentService,
  unlikeCommentService,
  addReplyService,
  deleteReplyService,
  resharePostService,
  getAllPostsService,
  getPostByIdService,
  getCommentsService,
}; 