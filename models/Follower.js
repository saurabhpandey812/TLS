const mongoose = require('mongoose');

const followerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true }, // the user being followed
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true }, // the user who follows
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

followerSchema.index({ user: 1, follower: 1 }, { unique: true });

module.exports = mongoose.model('Follower', followerSchema);