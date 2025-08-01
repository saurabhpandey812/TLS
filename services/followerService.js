const Follower = require('../models/Follower');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { createNotification } = require('../utils/notificationHelpers');
const { findProfileById, findProfileByEmail } = require('../utils/userHelpers');

async function sendFollowRequestService({ userId, targetUserId, user, io }) {
  if (userId === targetUserId) {
    return { success: false, message: 'You cannot follow yourself' };
  }
  let id = targetUserId;
  let targetUser = null;
  if (mongoose.Types.ObjectId.isValid(targetUserId) && !(targetUserId instanceof mongoose.Types.ObjectId)) {
    try {
      id = new mongoose.Types.ObjectId(targetUserId);
      targetUser = await Profile.findById(id);
    } catch (err) {}
  }
  if (!targetUser) {
    targetUser = await Profile.findOne({ _id: targetUserId });
  }
  if (!targetUser) {
    return { success: false, message: 'User not found' };
  }
  const existingFollow = await Follower.findOne({
    follower: userId,
    following: targetUserId
  });
  if (existingFollow) {
    if (existingFollow.status === 'accepted') {
      return { success: false, message: 'You are already following this user' };
    } else if (existingFollow.status === 'pending') {
      return { success: false, message: 'Follow request already sent' };
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
      title: targetUser.isPrivate
        ? 'You have a new follow request!'
        : 'You have a new follower!',
      message: targetUser.isPrivate
        ? `${user?.name || 'A user'} would like to follow you. You can accept or reject this request from your follow requests tab.`
        : `${user?.name || 'A user'} is now following you. Check out their profile or send a message!`,
      data: {
        followerId: userId,
        followerName: user?.name || '',
        followerAvatar: user?.avatar || '',
        deepLink: targetUser.isPrivate
          ? 'app://requests' // Deep link to requests tab
          : `app://profile/${userId}`,
        buttons: targetUser.isPrivate
          ? [
              { text: 'View Requests', action: 'app://requests' },
              { text: 'View Profile', action: `app://profile/${userId}` }
            ]
          : [
              { text: 'View Profile', action: `app://profile/${userId}` },
              { text: 'Message', action: `app://chat/${userId}` }
            ],
        context: {
          isPrivate: targetUser.isPrivate,
          timestamp: new Date(),
        },
      },
    });
    await notification.save();
  }
  if (io) {
    const senderProfile = user;
    if (targetUser.isPrivate) {
      io.to(String(targetUserId)).emit('follow_request', {
        sender: {
          _id: senderProfile?._id,
          name: senderProfile?.name,
          avatar: senderProfile?.avatar || '',
        },
        followerId: userId,
      });
    } else {
      io.to(String(targetUserId)).emit('follow_accepted', {
        sender: {
          _id: senderProfile?._id,
          name: senderProfile?.name,
          avatar: senderProfile?.avatar || '',
        },
        followerId: userId,
      });
    }
  }
  if (!targetUser.isPrivate) {
    await Profile.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } });
    await Profile.findByIdAndUpdate(userId, { $inc: { followingCount: 1 } });
  }
  return {
    success: true,
    message: targetUser.isPrivate ? 'Follow request sent' : 'Successfully followed',
    status: targetUser.isPrivate ? 'pending' : 'accepted'
  };
}

async function acceptFollowRequestService({ userId, followerId, user, io }) {
  const followRequest = await Follower.findOne({
    follower: followerId,
    following: userId,
    status: 'pending'
  });
  if (!followRequest) {
    return { success: false, message: 'Follow request not found' };
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
    title: 'Your follow request was accepted!',
    message: `${user?.name || 'The user'} has accepted your follow request. You can now view their posts and interact with them.`,
    data: {
      followingId: userId,
      followingName: user?.name || '',
      followingAvatar: user?.avatar || '',
      deepLink: `app://profile/${userId}`,
      buttons: [
        { text: 'View Profile', action: `app://profile/${userId}` },
        { text: 'Message', action: `app://chat/${userId}` }
      ],
      context: {
        timestamp: new Date(),
      },
    },
  });
  await notification.save();
  if (io) {
    io.to(String(followerId)).emit('follow_accepted', { notification });
  }
  return { success: true, message: 'Follow request accepted' };
}

async function rejectFollowRequestService({ userId, followerId, user, io }) {
  const followRequest = await Follower.findOne({
    follower: followerId,
    following: userId,
    status: 'pending'
  });
  if (!followRequest) {
    return { success: false, message: 'Follow request not found' };
  }
  followRequest.status = 'rejected';
  followRequest.respondedAt = new Date();
  await followRequest.save();
  const notification = new Notification({
    recipient: followerId,
    sender: userId,
    type: 'follow_rejected',
    title: 'Your follow request was declined',
    message: `${user?.name || 'The user'} has declined your follow request. You can try following other users or connect later.`,
    data: {
      followingId: userId,
      followingName: user?.name || '',
      followingAvatar: user?.avatar || '',
      deepLink: `app://profile/${userId}`,
      buttons: [
        { text: 'View Profile', action: `app://profile/${userId}` } // Only view profile for now
      ],
      context: {
        timestamp: new Date(),
      },
    },
  });
  await notification.save();
  if (io) {
    io.to(String(followerId)).emit('follow_rejected', { notification });
  }
  return { success: true, message: 'Follow request rejected' };
}

async function unfollowUserService({ userId, targetUserId }) {
  const followRelationship = await Follower.findOne({
    follower: userId,
    following: targetUserId,
    status: 'accepted'
  });
  if (!followRelationship) {
    return { success: false, message: 'You are not following this user' };
  }
  await Follower.deleteOne({ _id: followRelationship._id });
  await Profile.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } });
  await Profile.findByIdAndUpdate(userId, { $inc: { followingCount: -1 } });
  return { success: true, message: 'Unfollowed successfully' };
}

async function getPendingFollowRequestsService({ userId, page = 1, limit = 20 }) {
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
  return {
    success: true,
    requests: pendingRequests,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit)
  };
}

async function getFollowersService({ targetUserId, userId, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;
  const targetUser = await Profile.findById(targetUserId);
  if (!targetUser) {
    return { success: false, message: 'User not found' };
  }
  if (targetUser.isPrivate && targetUserId !== userId) {
    const followStatus = await Follower.findOne({
      follower: userId,
      following: targetUserId,
      status: 'accepted'
    });
    if (!followStatus) {
      return { success: false, message: 'Cannot view followers of private profile' };
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
  return {
    success: true,
    followers,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit)
  };
}

async function getFollowingService({ targetUserId, userId, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;
  const targetUser = await Profile.findById(targetUserId);
  if (!targetUser) {
    return { success: false, message: 'User not found' };
  }
  if (targetUser.isPrivate && targetUserId !== userId) {
    const followStatus = await Follower.findOne({
      follower: userId,
      following: targetUserId,
      status: 'accepted'
    });
    if (!followStatus) {
      return { success: false, message: 'Cannot view following of private profile' };
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
  return {
    success: true,
    following,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit)
  };
}

async function checkFollowStatusService({ userId, targetUserId }) {
  const followStatus = await Follower.findOne({
    follower: userId,
    following: targetUserId
  });
  if (!followStatus) {
    return { success: true, status: 'not_following' };
  }
  return { success: true, status: followStatus.status };
}

module.exports = {
  sendFollowRequestService,
  acceptFollowRequestService,
  rejectFollowRequestService,
  unfollowUserService,
  getPendingFollowRequestsService,
  getFollowersService,
  getFollowingService,
  checkFollowStatusService,
}; 