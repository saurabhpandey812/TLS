const Profile = require('../models/Profile');
const User = require('../models/User');
const mongoose = require('mongoose');
const { updateProfileService, searchUsersService, getProfileService, getCurrentUserProfileService, togglePrivacyService } = require('../services/profileService');

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

module.exports = {
  getProfile,
  updateProfile,
  searchUsers,
  getCurrentUserProfile,
  togglePrivacy,
};