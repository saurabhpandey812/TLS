const Profile = require('../models/Profile');
const mongoose = require('mongoose');

/**
 * Uploads a file to Cloudinary and returns the secure URL.
 * @param {string} dataUrl - The base64 data URL of the file.
 * @param {string} folder - The Cloudinary folder.
 * @param {string} resourceType - The resource type (image/raw).
 * @returns {Promise<string>} - The secure URL.
 */
async function uploadToCloudinary(dataUrl, folder, resourceType = 'image') {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
    api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret',
  });
  const uploadRes = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: resourceType,
  });
  return uploadRes.secure_url;
}

/**
 * Validates profile fields.
 * @param {Object} data
 * @returns {Object|null} - Error object or null if valid.
 */
function validateProfileFields(data) {
  if (!data.name || !data.email) {
    return { message: 'Name and email are required fields' };
  }
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(data.email)) {
    return { message: 'Please enter a valid email address' };
  }
  return null;
}

/**
 * Updates a profile with provided fields and handles uploads.
 */
async function updateProfileService(userId, fields) {
  const validationError = validateProfileFields(fields);
  if (validationError) return { success: false, ...validationError };

  let avatarUrl, verificationDocUrl;
  if (fields.avatar && fields.avatar.startsWith('data:image')) {
    avatarUrl = await uploadToCloudinary(fields.avatar, 'tls-avatars', 'image');
  }
  if (fields.verificationDoc && fields.verificationDoc.startsWith('data:')) {
    verificationDocUrl = await uploadToCloudinary(fields.verificationDoc, 'tls-verification', 'raw');
  }

  const updateObj = {};
  if (typeof fields.name === 'string') updateObj.name = fields.name.trim();
  if (typeof fields.email === 'string') updateObj.email = fields.email.trim().toLowerCase();
  if (typeof fields.bio === 'string') updateObj.bio = fields.bio;
  if (typeof fields.location === 'string') updateObj.location = fields.location;
  if (typeof fields.website === 'string') updateObj.website = fields.website;
  if (avatarUrl) updateObj.avatar = avatarUrl;
  if (typeof fields.professionalTitle === 'string') updateObj.professionalTitle = fields.professionalTitle;
  if (Array.isArray(fields.practiceAreas)) updateObj.practiceAreas = fields.practiceAreas;
  if (fields.yearsOfExperience !== undefined) updateObj.yearsOfExperience = fields.yearsOfExperience;
  if (typeof fields.barNumber === 'string') updateObj.barNumber = fields.barNumber;
  if (typeof fields.firm === 'string') updateObj.firm = fields.firm;
  if (verificationDocUrl) updateObj.verificationDoc = verificationDocUrl;
  else if (typeof fields.verificationDoc === 'string' && !fields.verificationDoc.startsWith('data:')) updateObj.verificationDoc = fields.verificationDoc;
  if (typeof fields.officeAddress === 'string') updateObj.officeAddress = fields.officeAddress;
  if (Array.isArray(fields.languages)) updateObj.languages = fields.languages;
  if (typeof fields.availability === 'string') updateObj.availability = fields.availability;
  if (typeof fields.linkedin === 'string') updateObj.linkedin = fields.linkedin;

  const updatedProfile = await Profile.findByIdAndUpdate(
    userId,
    updateObj,
    { new: true, runValidators: true }
  ).select('_id name email email_verified mobile_verified updated_at avatar bio location website professionalTitle practiceAreas yearsOfExperience barNumber firm verificationDoc officeAddress languages availability linkedin');

  if (!updatedProfile) {
    return { success: false, message: 'Profile not found' };
  }
  return { success: true, message: 'Profile updated successfully', data: updatedProfile };
}

/**
 * Searches users by id, email, name, or mobile.
 */
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

/**
 * Gets a profile by userId.
 */
async function getProfileService(userId) {
  const profile = await Profile.findById(userId).select('-password -otp -otpExpires');
  if (!profile) {
    return { success: false, message: 'Profile not found' };
  }
  return { success: true, data: profile };
}

/**
 * Gets the current user's profile by userId or email.
 */
async function getCurrentUserProfileService({ userId, userEmail }) {
  let profile = null;
  if (userId) {
    profile = await Profile.findById(userId).select('-password -otp -otpExpires');
  }
  if (!profile && userEmail) {
    profile = await Profile.findOne({ email: userEmail }).select('-password -otp -otpExpires');
  }
  if (!profile) {
    return { success: false, message: 'Profile not found for this user.' };
  }
  const profileObj = profile.toObject();
  profileObj.avatar = profileObj.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profileObj?.name || 'User');
  profileObj.bio = profileObj.bio || '';
  profileObj.location = profileObj.location || '';
  profileObj.website = profileObj.website || '';
  return { success: true, data: profileObj };
}

/**
 * Toggles the privacy setting of a profile.
 */
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