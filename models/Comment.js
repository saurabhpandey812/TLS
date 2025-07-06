const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

commentSchema.index({ post: 1 });
commentSchema.index({ user: 1 });
commentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);