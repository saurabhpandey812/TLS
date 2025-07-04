const Profile = require('../models/Profile');
const User = require('../models/User');
const mongoose = require('mongoose');

const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('[getProfile] Fetching profile for userId:', userId);
    const profile = await Profile.findById(userId).select('-password -otp -otpExpires');
    console.log('[getProfile] Profile found:', profile);
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }
    res.json({
      success: true,
      data: profile
    });
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
    const {
      name, email, bio, location, website, avatar,
      professionalTitle, practiceAreas, yearsOfExperience, barNumber, firm,
      verificationDoc, officeAddress, languages, availability, linkedin
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required fields'
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    let avatarUrl;
    // If avatar is a base64 string, upload to Cloudinary
    if (avatar && avatar.startsWith('data:image')) {
      try {
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: 'rits7275',
          api_key: '711285582753914',
          api_secret: 'c7-9frT8R24On200DG8QU86JFU0',
        });
        const uploadRes = await cloudinary.uploader.upload(avatar, {
          folder: 'tls-avatars',
          resource_type: 'image',
        });
        avatarUrl = uploadRes.secure_url;
      } catch (cloudErr) {
        console.error('Cloudinary avatar upload error:', cloudErr);
        return res.status(500).json({ success: false, message: 'Avatar upload failed', error: cloudErr.message });
      }
    }

    let verificationDocUrl;
    // If verificationDoc is a base64 string, upload to Cloudinary as raw file
    if (verificationDoc && verificationDoc.startsWith('data:')) {
      try {
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: 'rits7275',
          api_key: '711285582753914',
          api_secret: 'c7-9frT8R24On200DG8QU86JFU0',
        });
        const uploadRes = await cloudinary.uploader.upload(verificationDoc, {
          folder: 'tls-verification',
          resource_type: 'raw',
        });
        verificationDocUrl = uploadRes.secure_url;
      } catch (cloudErr) {
        console.error('Cloudinary verification doc upload error:', cloudErr);
        return res.status(500).json({ success: false, message: 'Verification document upload failed', error: cloudErr.message });
      }
    }

    // Build update object with only provided fields
    const updateObj = {};
    if (typeof name === 'string') updateObj.name = name.trim();
    if (typeof email === 'string') updateObj.email = email.trim().toLowerCase();
    if (typeof bio === 'string') updateObj.bio = bio;
    if (typeof location === 'string') updateObj.location = location;
    if (typeof website === 'string') updateObj.website = website;
    if (avatarUrl) updateObj.avatar = avatarUrl;
    if (typeof professionalTitle === 'string') updateObj.professionalTitle = professionalTitle;
    if (Array.isArray(practiceAreas)) updateObj.practiceAreas = practiceAreas;
    if (yearsOfExperience !== undefined) updateObj.yearsOfExperience = yearsOfExperience;
    if (typeof barNumber === 'string') updateObj.barNumber = barNumber;
    if (typeof firm === 'string') updateObj.firm = firm;
    if (verificationDocUrl) updateObj.verificationDoc = verificationDocUrl;
    else if (typeof verificationDoc === 'string' && !verificationDoc.startsWith('data:')) updateObj.verificationDoc = verificationDoc;
    if (typeof officeAddress === 'string') updateObj.officeAddress = officeAddress;
    if (Array.isArray(languages)) updateObj.languages = languages;
    if (typeof availability === 'string') updateObj.availability = availability;
    if (typeof linkedin === 'string') updateObj.linkedin = linkedin;

    // Find and update the profile
    const updatedProfile = await Profile.findByIdAndUpdate(
      userId,
      updateObj,
      { new: true, runValidators: true }
    ).select('_id name email email_verified mobile_verified updated_at avatar bio location website professionalTitle practiceAreas yearsOfExperience barNumber firm verificationDoc officeAddress languages availability linkedin');

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (err) {
    console.error('Profile update error:', err);
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = {};
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Search users by id, email, name, or mobile
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    let users;
    if (!query) {
      // Fetch all users from Profile
      users = await Profile.find({}).select('name email mobile avatar');
      console.log('Fetching all profiles. Found:', users.length);
    } else {
      console.log('Searching for profiles with query:', query);
      const searchRegex = new RegExp(query, 'i');
      const orConditions = [
        { email: searchRegex },
        { name: searchRegex },
        { mobile: searchRegex },
      ];
      if (mongoose.Types.ObjectId.isValid(query)) {
        orConditions.unshift({ _id: mongoose.Types.ObjectId(query) });
      }
      console.log('MongoDB $or conditions:', orConditions);
      users = await Profile.find({ $or: orConditions }).select('name email mobile avatar');
      console.log('Found profiles:', users);
    }
    res.json({ success: true, users });
  } catch (error) {
    console.error('Profile search error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId || (req.auth && req.auth.id);
    const userEmail = req.user?.email;
    if (!userId && !userEmail) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    let profile = null;
    if (userId) {
      profile = await Profile.findById(userId).select('-password -otp -otpExpires');
    }
    if (!profile && userEmail) {
      profile = await Profile.findOne({ email: userEmail }).select('-password -otp -otpExpires');
    }
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found for this user.' });
    }
    const profileObj = profile.toObject();
    profileObj.avatar = profileObj.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profileObj.name || 'User');
    profileObj.bio = profileObj.bio || '';
    profileObj.location = profileObj.location || '';
    profileObj.website = profileObj.website || '';
    return res.json({ success: true, data: profileObj });
  } catch (error) {
    console.error('[getCurrentUserProfile] Server error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Toggle profile privacy (public/private)
const togglePrivacy = async (req, res) => {
  try {
    const { userId } = req.user;
    const profile = await Profile.findById(userId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    profile.isPrivate = !profile.isPrivate;
    await profile.save();
    res.status(200).json({ message: `Profile is now ${profile.isPrivate ? 'private' : 'public'}`, isPrivate: profile.isPrivate });
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