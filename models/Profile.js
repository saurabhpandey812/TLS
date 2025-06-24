const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const profileSchema = new mongoose.Schema({
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
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Remove any unique indexes on email and mobile
profileSchema.index({ email: 1 }, { sparse: false, unique: false });
profileSchema.index({ mobile: 1 }, { sparse: false, unique: false });




module.exports = mongoose.model('Profile', profileSchema);