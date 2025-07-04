const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  media: [String],
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  images: [String],
  video: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who liked this post
  likeCount: { type: Number, default: 0 },
  comments: [
    {
      content: { type: String, required: true },
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
      createdAt: { type: Date, default: Date.now },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      replies: [
        {
          content: { type: String, required: true },
          author: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
          createdAt: { type: Date, default: Date.now },
          likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        }
      ]
    }
  ],
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
