const Follower = require('../models/Follower');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Send follow request
const sendFollowRequest = async (req, res) => {
  try {
    const { userId } = req.user; // From auth middleware
    const { targetUserId } = req.params;

    if (userId === targetUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    let id = targetUserId;
    let targetUser = null;
    if (mongoose.Types.ObjectId.isValid(targetUserId) && !(targetUserId instanceof mongoose.Types.ObjectId)) {
      try {
        id = new mongoose.Types.ObjectId(targetUserId);
        console.log('[sendFollowRequest] Trying ObjectId _id:', id);
        targetUser = await Profile.findById(id);
      } catch (err) {
        console.error('[sendFollowRequest] Error creating ObjectId:', err);
      }
    }
    if (!targetUser) {
      console.log('[sendFollowRequest] Trying string _id:', targetUserId);
      targetUser = await Profile.findOne({ _id: targetUserId });
    }
    console.log('[sendFollowRequest] Profile found:', targetUser);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const existingFollow = await Follower.findOne({
      follower: userId,
      following: targetUserId
    });
    if (existingFollow) {
      if (existingFollow.status === 'accepted') {
        return res.status(400).json({ message: 'You are already following this user' });
      } else if (existingFollow.status === 'pending') {
        return res.status(400).json({ message: 'Follow request already sent' });
      } else if (existingFollow.status === 'rejected') {
        existingFollow.status = 'pending';
        existingFollow.requestedAt = new Date();
        await existingFollow.save();
      }
    } else {
      const followRequest = new Follower({
        follower: userId,
        following: targetUserId,
        status: targetUser.isPrivate ? 'pending' : 'accepted',
        isPrivate: targetUser.isPrivate
      });
      await followRequest.save();
    }
    const notifType = targetUser.isPrivate ? 'follow_request' : 'follow_accepted';
    const existing = await Notification.findOne({
      recipient: targetUserId,
      sender: userId,
      type: notifType,
      'data.followerId': userId,
      isRead: false,
    });
    if (!existing) {
      const notification = new Notification({
        recipient: targetUserId,
        sender: userId,
        type: notifType,
        title: targetUser.isPrivate ? 'New Follow Request' : 'New Follower',
        message: targetUser.isPrivate 
          ? `${req.user.name} wants to follow you`
          : `${req.user.name} started following you`,
        data: { followerId: userId }
      });
      await notification.save();
    }
    // Emit real-time event for follow request or accepted
    const io = req.app.get('io');
    if (io) {
      const senderProfile = req.user;
      if (targetUser.isPrivate) {
        io.to(String(targetUserId)).emit('follow_request', {
          sender: {
            _id: senderProfile._id,
            name: senderProfile.name,
            avatar: senderProfile.avatar || '',
          },
          followerId: userId,
        });
      } else {
        io.to(String(targetUserId)).emit('follow_accepted', {
          sender: {
            _id: senderProfile._id,
            name: senderProfile.name,
            avatar: senderProfile.avatar || '',
          },
          followerId: userId,
        });
      }
    }
    if (!targetUser.isPrivate) {
      await Profile.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } });
      await Profile.findByIdAndUpdate(userId, { $inc: { followingCount: 1 } });
    }
    res.status(200).json({ 
      message: targetUser.isPrivate ? 'Follow request sent' : 'Successfully followed',
      status: targetUser.isPrivate ? 'pending' : 'accepted'
    });
  } catch (error) {
    console.error('Error sending follow request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Accept follow request
const acceptFollowRequest = async (req, res) => {
  try {
    const { userId } = req.user;
    const { followerId } = req.params;
    const followRequest = await Follower.findOne({
      follower: followerId,
      following: userId,
      status: 'pending'
    });
    if (!followRequest) {
      return res.status(404).json({ message: 'Follow request not found' });
    }
    followRequest.status = 'accepted';
    followRequest.respondedAt = new Date();
    await followRequest.save();
    await Profile.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } });
    await Profile.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
    const notification = new Notification({
      recipient: followerId,
      sender: userId,
      type: 'follow_accepted',
      title: 'Follow Request Accepted',
      message: `${req.user.name} accepted your follow request`,
      data: { followingId: userId }
    });
    await notification.save();
    // Emit real-time event for follow accepted
    const io = req.app.get('io');
    if (io) {
      io.to(String(followerId)).emit('follow_accepted', { notification });
    }
    res.status(200).json({ message: 'Follow request accepted' });
  } catch (error) {
    console.error('Error accepting follow request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reject follow request
const rejectFollowRequest = async (req, res) => {
  try {
    const { userId } = req.user;
    const { followerId } = req.params;
    const followRequest = await Follower.findOne({
      follower: followerId,
      following: userId,
      status: 'pending'
    });
    if (!followRequest) {
      return res.status(404).json({ message: 'Follow request not found' });
    }
    followRequest.status = 'rejected';
    followRequest.respondedAt = new Date();
    await followRequest.save();
    const notification = new Notification({
      recipient: followerId,
      sender: userId,
      type: 'follow_rejected',
      title: 'Follow Request Rejected',
      message: `${req.user.name} rejected your follow request`,
      data: { followingId: userId }
    });
    await notification.save();
    // Emit real-time event for follow rejected
    const io = req.app.get('io');
    if (io) {
      io.to(String(followerId)).emit('follow_rejected', { notification });
    }
    res.status(200).json({ message: 'Follow request rejected' });
  } catch (error) {
    console.error('Error rejecting follow request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Unfollow user
const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetUserId } = req.params;
    const followRelationship = await Follower.findOne({
      follower: userId,
      following: targetUserId,
      status: 'accepted'
    });
    if (!followRelationship) {
      return res.status(404).json({ message: 'You are not following this user' });
    }
    await Follower.findByIdAndDelete(followRelationship._id);
    await Profile.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } });
    await Profile.findByIdAndUpdate(userId, { $inc: { followingCount: -1 } });
    res.status(200).json({ message: 'Successfully unfollowed' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get pending follow requests
const getPendingFollowRequests = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const pendingRequests = await Follower.find({
      following: userId,
      status: 'pending'
    })
    .populate('follower', 'name email avatar bio')
    .sort({ requestedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    const total = await Follower.countDocuments({
      following: userId,
      status: 'pending'
    });
    res.status(200).json({
      requests: pendingRequests,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting pending follow requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's followers
const getFollowers = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { userId } = req.user;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const targetUser = await Profile.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (targetUser.isPrivate && targetUserId !== userId) {
      const followStatus = await Follower.findOne({
        follower: userId,
        following: targetUserId,
        status: 'accepted'
      });
      if (!followStatus) {
        return res.status(403).json({ message: 'Cannot view followers of private profile' });
      }
    }
    const followers = await Follower.find({
      following: targetUserId,
      status: 'accepted'
    })
    .populate('follower', 'name email avatar bio followersCount followingCount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    const total = await Follower.countDocuments({
      following: targetUserId,
      status: 'accepted'
    });
    res.status(200).json({
      followers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's following
const getFollowing = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { userId } = req.user;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const targetUser = await Profile.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (targetUser.isPrivate && targetUserId !== userId) {
      const followStatus = await Follower.findOne({
        follower: userId,
        following: targetUserId,
        status: 'accepted'
      });
      if (!followStatus) {
        return res.status(403).json({ message: 'Cannot view following of private profile' });
      }
    }
    const following = await Follower.find({
      follower: targetUserId,
      status: 'accepted'
    })
    .populate('following', 'name email avatar bio followersCount followingCount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    const total = await Follower.countDocuments({
      follower: targetUserId,
      status: 'accepted'
    });
    res.status(200).json({
      following,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting following:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Check follow status
const checkFollowStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetUserId } = req.params;
    const followStatus = await Follower.findOne({
      follower: userId,
      following: targetUserId
    });
    if (!followStatus) {
      return res.status(200).json({ status: 'not_following' });
    }
    res.status(200).json({ status: followStatus.status });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  unfollowUser,
  getPendingFollowRequests,
  getFollowers,
  getFollowing,
  checkFollowStatus
};
