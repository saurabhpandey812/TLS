const Notification = require('../models/Notification');

// Get notifications for the logged-in user (most recent first)
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const notifications = await Notification.find({ recipient: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Notification.countDocuments({ recipient: userId, isDeleted: false });
    res.json({ notifications, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
};

// Mark notifications as read (accepts array of notification IDs)
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ message: 'No notification IDs provided' });
    }
    await Notification.updateMany(
      { recipient: userId, _id: { $in: notificationIds } },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error marking notifications as read', error: err.message });
  }
};

// Delete a notification (soft delete)
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { $set: { isDeleted: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting notification', error: err.message });
  }
}; 