const Profile = require('../models/Profile');
const User = require('../models/User');
const mongoose = require('mongoose');
const { updateProfileService, searchUsersService, getProfileService, getCurrentUserProfileService, togglePrivacyService } = require('../services/profileService');
const Follower = require('../models/Follower');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { uploadToCloudinary } = require('../services/cloudinary');
require('dotenv').config();

// Helper to format profile response (never include password)
function formatProfile(profile) {
  if (!profile) return null;
  const obj = profile.toObject ? profile.toObject() : profile;
  delete obj.password;
  return obj;
}

// Register a new user
const register = async (req, res) => {
  try {
    const {
      name, username, email, mobile, password, avatar, bio, website, gender, dob, isPrivate, location,
      professionalTitle, practiceAreas, yearsOfExperience, barNumber, firm, verificationDoc, officeAddress,
      languages, availability, linkedin, coverPhoto
    } = req.body;
    if (!name || !username || !password || (!email && !mobile)) {
      return res.status(400).json({ success: false, message: 'Name, username, password, and either email or mobile are required.' });
    }
    const existing = await Profile.findOne({ $or: [email ? { email } : {}, mobile ? { mobile } : {}, { username }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email, mobile, or username already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const profile = await Profile.create({
      name, username, email, mobile, password: hashedPassword, avatar, bio, website, gender, dob, isPrivate, location,
      professionalTitle, practiceAreas, yearsOfExperience, barNumber, firm, verificationDoc, officeAddress,
      languages, availability, linkedin, coverPhoto
    });
    res.status(201).json({ success: true, profile: formatProfile(profile) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

// Login user (by email or mobile)
const login = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;
    if ((!email && !mobile) || !password) {
      return res.status(400).json({ success: false, message: 'Email or mobile and password required.' });
    }
    const profile = await Profile.findOne(email ? { email } : { mobile });
    if (!profile) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }
    const match = await bcrypt.compare(password, profile.password);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: profile._id, name: profile.name, email: profile.email, mobile: profile.mobile }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ success: true, accessToken: token, profile: formatProfile(profile) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

// Get user profile by ID
const getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findById(id).select('-password');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, profile: formatProfile(profile) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
};

// Update profile avatar
const updateAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const uploadRes = await uploadToCloudinary(req.file.path, 'image');
    const profile = await Profile.findByIdAndUpdate(
      userId,
      { avatar: uploadRes.secure_url },
      { new: true }
    ).select('-password');
    res.status(200).json({ success: true, profile: formatProfile(profile) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update avatar', error: error.message });
  }
};

// Update profile fields
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const allowedFields = [
      'name', 'bio', 'website', 'gender', 'dob', 'isPrivate', 'location',
      'professionalTitle', 'practiceAreas', 'yearsOfExperience', 'barNumber', 'firm', 'verificationDoc',
      'officeAddress', 'languages', 'availability', 'linkedin', 'coverPhoto'
    ];
    const update = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }
    const profile = await Profile.findByIdAndUpdate(userId, update, { new: true }).select('-password');
    res.status(200).json({ success: true, profile: formatProfile(profile) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

module.exports = { register, login, getProfile, updateAvatar, updateProfile };
