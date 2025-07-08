const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  caption: { type: String },
  content: { type: String },
  media: [
    {
      url: { type: String },
      type: { type: String, enum: ['image', 'video'] }
    }
  ],
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: false },
  images: [String],
  video: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },
  reshareCount: { type: Number, default: 0 },
  isReshare: { type: Boolean, default: false },
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  comments: [
    {
      content: { type: String },
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
      createdAt: { type: Date, default: Date.now },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      replies: [
        {
          content: { type: String },
          author: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
          createdAt: { type: Date, default: Date.now },
          likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        }
      ]
    }
  ],
}, {
  timestamps: true
});

postSchema.index({ user: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
