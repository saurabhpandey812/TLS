const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  mobile: {
    type: String,
    required: false,
    trim: true,
    match: [/^\+\d{10,15}$/, 'Please enter a valid mobile number in E.164 format (e.g., +1234567890)'],
  },
  password: { type: String, required: true },
  email_verified: { type: Boolean, default: false },
  mobile_verified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  bio: { type: String, maxlength: 500 },
  avatar: { type: String },
  coverPhoto: { type: String },
  backgroundImage: { type: String },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  pushNotifications: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  publicKey: { type: String, required: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

userSchema.index({ email: 1 }, { sparse: true, unique: false });
userSchema.index({ mobile: 1 }, { sparse: true, unique: false });

module.exports = mongoose.model('User', userSchema);