const Profile = require('../models/Profile');
const User = require('../models/User');

async function findProfileById(id) {
  return Profile.findById(id).select('-password -otp -otpExpires');
}

async function findProfileByEmail(email) {
  return Profile.findOne({ email }).select('-password -otp -otpExpires');
}

async function findUserById(id) {
  return User.findById(id).select('-password -otp -otpExpires');
}

async function findUserByEmail(email) {
  return User.findOne({ email }).select('-password -otp -otpExpires');
}

module.exports = {
  findProfileById,
  findProfileByEmail,
  findUserById,
  findUserByEmail,
}; 