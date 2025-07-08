const mongoose = require('mongoose');

const followerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: false, index: true }, // the user being followed
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true }, // the user who follows
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: false },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  isPrivate: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

followerSchema.index({ follower: 1, following: 1 }, { unique: true });
followerSchema.index({ user: 1, follower: 1 }, { unique: true });
followerSchema.index({ following: 1, status: 1 });

module.exports = mongoose.model('Follower', followerSchema);