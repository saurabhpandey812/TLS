const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const profileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, index: true },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  mobile: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    match: [/^\+\d{10,15}$/, 'Please enter a valid mobile number in E.164 format (e.g., +1234567890)'],
  },
  password: { type: String, required: true },
  avatar: { type: String, default: null },
  bio: { type: String, default: null },
  website: { type: String, default: null },
  gender: { type: String, default: null },
  dob: { type: Date, default: null },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  postsCount: { type: Number, default: 0 },
  isPrivate: { type: Boolean, default: false },
  email_verified: { type: Boolean, default: false },
  mobile_verified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Remove any unique indexes on email and mobile
profileSchema.index({ email: 1 }, { sparse: false, unique: false });
profileSchema.index({ mobile: 1 }, { sparse: false, unique: false });

module.exports = mongoose.model('Profile', profileSchema);