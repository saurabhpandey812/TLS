const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const profileSchema = new mongoose.Schema({
  name: { type: String },
  email: { 
    type: String, 
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  
  mobile: { 
    type: String,
    trim: true,
    match: [/^\+\d{10,15}$/, 'Please enter a valid mobile number in E.164 format (e.g., +1234567890)'],
  },
  
  password: { type: String, required: true },
  email_verified: { type: Boolean, default: false },
  mobile_verified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  avatar: { type: String },
  bio: { type: String, maxlength: 500 },
  isPrivate: { type: Boolean, default: false },
  location: { type: String },
  website: { type: String },
  // Professional fields
  professionalTitle: { type: String },
  practiceAreas: [{ type: String }],
  yearsOfExperience: { type: Number, min: 0 },
  barNumber: { type: String },
  firm: { type: String },
  verificationDoc: { type: String }, // URL or base64
  officeAddress: { type: String },
  languages: [{ type: String }],
  availability: { type: String, enum: ['Available', 'Busy', 'On Leave'], default: 'Available' },
  linkedin: { type: String },
  coverPhoto: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Remove any unique indexes on email and mobile
profileSchema.index({ email: 1 }, { sparse: false, unique: false });
profileSchema.index({ mobile: 1 }, { sparse: false, unique: false });




module.exports = mongoose.model('Profile', profileSchema, 'profiles');