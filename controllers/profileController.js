const Profile = require('../models/Profile');
const User = require('../models/User');
const mongoose = require('mongoose');
const { updateProfileService, searchUsersService, getProfileService, getCurrentUserProfileService, togglePrivacyService } = require('../services/profileService');
const Follower = require('../models/Follower');

const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('[getProfile] Fetching profile for userId:', userId);
    const result = await getProfileService(userId);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await updateProfileService(userId, req.body);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const result = await searchUsersService(query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Profile search error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId || (req.auth && req.auth.id);
    const userEmail = req.user?.email;
    const result = await getCurrentUserProfileService({ userId, userEmail });
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[getCurrentUserProfile] Server error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Toggle profile privacy (public/private)
const togglePrivacy = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const result = await togglePrivacyService(userId);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error toggling privacy:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const setPublicKey = async (req, res) => {
  const { userId, publicKey } = req.body;
  if (!userId || !publicKey) return res.status(400).json({ error: 'Missing userId or publicKey' });
  await User.findByIdAndUpdate(userId, { publicKey });
  res.json({ success: true });
};

const getPublicKey = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId, 'publicKey');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ publicKey: user.publicKey });
};

const blockUser = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ success: false, message: 'Missing targetUserId' });
    await User.findByIdAndUpdate(userId, { $addToSet: { blockedUsers: targetUserId } });
    return res.status(200).json({ success: true, message: 'User blocked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ success: false, message: 'Missing targetUserId' });
    await User.findByIdAndUpdate(userId, { $pull: { blockedUsers: targetUserId } });
    return res.status(200).json({ success: true, message: 'User unblocked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    // Find all users this user follows
    const following = await Follower.find({ follower: userId, status: 'accepted' }).select('following');
    // Find all users who follow this user
    const followers = await Follower.find({ following: userId, status: 'accepted' }).select('follower');
    // Get mutual connections (intersection)
    const followingIds = following.map(f => f.following.toString());
    const followerIds = followers.map(f => f.follower.toString());
    const mutualIds = followingIds.filter(id => followerIds.includes(id));
    // Fetch profile info for mutual connections
    const profiles = await Profile.find({ _id: { $in: mutualIds } })
      .select('_id name avatar user')
      .populate('user', '_id'); // Populate the user field

    // Return user._id instead of profile._id
    const result = profiles.map(profile => ({
      _id: profile.user?._id, // This is the User ID
      name: profile.name,
      avatar: profile.avatar,
      profileId: profile._id, // Optionally include the profile ID
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  searchUsers,
  getCurrentUserProfile,
  togglePrivacy,
  setPublicKey,
  getPublicKey,
  blockUser,
  unblockUser,
  getConnections,
};