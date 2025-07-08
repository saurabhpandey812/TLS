const Like = require('../models/Like');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');

// Like a post
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

// Unlike a post
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

// Get all users who liked a post
async function getPostLikesService(postId) {
  const likes = await Like.find({ postId }).populate({
    path: 'userId',
    select: 'name avatar',
    model: Profile,
  });
  return { success: true, likes };
}

// Like a comment
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

// Unlike a comment
async function unlikeCommentService({ postId, commentId, userId }) {
  const post = await Post.findById(postId);
  if (!post) return { success: false, message: 'Post not found' };
  const comment = post.comments.id(commentId);
  if (!comment) return { success: false, message: 'Comment not found' };
  comment.likes = comment.likes.filter(id => String(id) !== String(userId));
  await post.save();
  return { success: true, likes: comment.likes };
}

module.exports = {
  likePostService,
  unlikePostService,
  getPostLikesService,
  likeCommentService,
  unlikeCommentService,
}; 