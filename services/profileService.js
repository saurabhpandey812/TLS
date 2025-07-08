const Profile = require('../models/Profile');
const mongoose = require('mongoose');
const { uploadToCloudinary } = require('../utils/cloudinary');


 // Update a profile with provided fields and handle uploads.

async function updateProfileService(userId, fields) {
  let avatarUrl, verificationDocUrl, coverPhotoUrl;
  if (fields.avatar && fields.avatar.startsWith('data:image')) {
    avatarUrl = await uploadToCloudinary(fields.avatar, 'tls-avatars', 'image');
  }
  if (fields.verificationDoc && fields.verificationDoc.startsWith('data:')) {
    verificationDocUrl = await uploadToCloudinary(fields.verificationDoc, 'tls-verification', 'raw');
  }
  if (fields.coverPhoto && fields.coverPhoto.startsWith('data:image')) {
    coverPhotoUrl = await uploadToCloudinary(fields.coverPhoto, 'tls-cover-photo', 'image');
  }
  const updateObj = { ...fields };
  if (avatarUrl) updateObj.avatar = avatarUrl;
  if (verificationDocUrl) updateObj.verificationDoc = verificationDocUrl;
  if (coverPhotoUrl) updateObj.coverPhoto = coverPhotoUrl;
  const updatedProfile = await Profile.findByIdAndUpdate(
    userId,
    updateObj,
    { new: true, runValidators: true }
  ).select('-password -otp -otpExpires');
  if (!updatedProfile) {
    return { success: false, message: 'Profile not found' };
  }
  return { success: true, message: 'Profile updated successfully', data: updatedProfile };
}

// Search users by id, email, name, or mobile.

async function searchUsersService(query) {
  let users;
  if (!query) {
    users = await Profile.find({}).select('name email mobile avatar');
  } else {
    const searchRegex = new RegExp(query, 'i');
    const orConditions = [
      { email: searchRegex },
      { name: searchRegex },
      { mobile: searchRegex },
    ];
    if (mongoose.Types.ObjectId.isValid(query)) {
      orConditions.unshift({ _id: mongoose.Types.ObjectId(query) });
    }
    users = await Profile.find({ $or: orConditions }).select('name email mobile avatar');
  }
  return { success: true, users };
}

// Get a profile by userId.

async function getProfileService(userId) {
  const profile = await Profile.findById(userId).select('-password -otp -otpExpires');
  if (!profile) {
    return { success: false, message: 'Profile not found' };
  }
  return { success: true, data: profile };
}

// Get the current user's profile by userId or email.

async function getCurrentUserProfileService({ userId, userEmail }) {
  let profile = null;
  let user = null;
  if (userId) {
    profile = await Profile.findById(userId).select('-password -otp -otpExpires');
    user = await require('../models/User').findById(userId).select('blockedUsers');
  }
  if (!profile && userEmail) {
    profile = await Profile.findOne({ email: userEmail }).select('-password -otp -otpExpires');
    user = await require('../models/User').findOne({ email: userEmail }).select('blockedUsers');
  }
  if (!profile) {
    return { success: false, message: 'Profile not found for this user.' };
  }
  const profileObj = profile.toObject();
  profileObj.avatar = profileObj.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profileObj?.name || 'User');
  profileObj.bio = profileObj.bio || '';
  profileObj.location = profileObj.location || '';
  profileObj.website = profileObj.website || '';
  profileObj.blockedUsers = user?.blockedUsers || [];
  return { success: true, data: profileObj };
}

// Toggle the privacy setting of a profile.

async function togglePrivacyService(userId) {
  const profile = await Profile.findById(userId);
  if (!profile) {
    return { success: false, message: 'Profile not found' };
  }
  profile.isPrivate = !profile.isPrivate;
  await profile.save();
  return { success: true, message: `Profile is now ${profile.isPrivate ? 'private' : 'public'}`, isPrivate: profile.isPrivate };
}

module.exports = {
  updateProfileService,
  searchUsersService,
  getProfileService,
  getCurrentUserProfileService,
  togglePrivacyService,
}; 