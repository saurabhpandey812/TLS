const mongoose = require('mongoose');

const followerSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  requestedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  isPrivate: { type: Boolean, default: false }, // If the following user's profile is private
}, {
  timestamps: true
});

// Compound index to ensure unique follower-following relationships
followerSchema.index({ follower: 1, following: 1 }, { unique: true });

// Index for querying by status
followerSchema.index({ following: 1, status: 1 });

module.exports = mongoose.model('Follower', followerSchema);