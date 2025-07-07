const Follower = require('../models/Follower');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { sendFollowRequestService, acceptFollowRequestService, rejectFollowRequestService, unfollowUserService, getPendingFollowRequestsService, getFollowersService, getFollowingService, checkFollowStatusService } = require('../services/followerService');

// Send follow request
const sendFollowRequest = async (req, res) => {
  try {
    const { userId } = req.user; // From auth middleware
    const { targetUserId } = req.params;
    const result = await sendFollowRequestService({ userId, targetUserId, user: req.user, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
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
    const result = await acceptFollowRequestService({ userId, followerId, user: req.user, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
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
    const result = await rejectFollowRequestService({ userId, followerId, user: req.user, io: req.app.get('io') });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
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
    const result = await unfollowUserService({ userId: req.user.userId, targetUserId: req.params.targetUserId });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get pending follow requests
const getPendingFollowRequests = async (req, res) => {
  try {
    const result = await getPendingFollowRequestsService({ userId: req.user.userId, page: req.query.page, limit: req.query.limit });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting pending follow requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's followers
const getFollowers = async (req, res) => {
  try {
    const result = await getFollowersService({ targetUserId: req.params.targetUserId, userId: req.user.userId, page: req.query.page, limit: req.query.limit });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's following
const getFollowing = async (req, res) => {
  try {
    const result = await getFollowingService({ targetUserId: req.params.targetUserId, userId: req.user.userId, page: req.query.page, limit: req.query.limit });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error getting following:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Check follow status
const checkFollowStatus = async (req, res) => {
  try {
    const result = await checkFollowStatusService({ userId: req.user.userId, targetUserId: req.params.targetUserId });
    return res.status(200).json(result);
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
