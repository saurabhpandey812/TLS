const Notification = require('../models/Notification');

async function getNotificationsService({ userId, page = 1, limit = 20 }) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const notifications = await Notification.find({ recipient: userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('sender', 'name avatar'); // Populate sender with name and avatar
  const total = await Notification.countDocuments({ recipient: userId, isDeleted: false });
  return { success: true, notifications, total, page: parseInt(page), limit: parseInt(limit) };
}

async function markAsReadService({ userId, notificationIds }) {
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return { success: false, message: 'No notification IDs provided' };
  }
  await Notification.updateMany(
    { recipient: userId, _id: { $in: notificationIds } },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return { success: true, message: 'Notifications marked as read' };
}

async function deleteNotificationService({ userId, id }) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!notification) {
    return { success: false, message: 'Notification not found' };
  }
  return { success: true, message: 'Notification deleted' };
}

module.exports = {
  getNotificationsService,
  markAsReadService,
  deleteNotificationService,
}; 