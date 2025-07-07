const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    // required: false, 
    // unique: false, 
    // sparse: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  
  mobile: { 
    type: String,
    required: false,
    // unique: false,
    // sparse: true,
    trim: true,
    match: [/^\+\d{10,15}$/, 'Please enter a valid mobile number in E.164 format (e.g., +1234567890)'],
  },
  
  password: { type: String, required: true },
  email_verified: { type: Boolean, default: false },
  mobile_verified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  
  // Profile settings
  bio: { type: String, maxlength: 500 },
  avatar: { type: String },
  coverPhoto: { type: String },
  backgroundImage: { type: String },
  
  // Follower/Following counts (cached for performance)
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  
  // Notification settings
  pushNotifications: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: true },
  
  // Account status
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Remove any unique indexes on email and mobile
userSchema.index({ email: 1 }, { sparse: true, unique: false });
userSchema.index({ mobile: 1 }, { sparse: true, unique: false });

// Index for privacy settings
userSchema.index({ isPrivate: 1 });

// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

module.exports = mongoose.model('User', userSchema);