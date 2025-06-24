const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: String,
  media: [String],
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
