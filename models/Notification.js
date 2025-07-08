const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['follow_request', 'follow_accepted', 'follow_rejected', 'new_post', 'like', 'comment', 'mention'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }, // Additional data like postId, commentId, etc.
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });

module.exports = mongoose.model('Notification', notificationSchema); 