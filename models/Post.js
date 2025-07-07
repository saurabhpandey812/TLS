const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  caption: { type: String },
  media: [
    {
      url: { type: String, required: true },
      type: { type: String, enum: ['image', 'video'], required: true }
    }
  ],
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
}, {
  timestamps: true
});

postSchema.index({ user: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
