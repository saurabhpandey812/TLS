const Notification = require('../models/Notification');
const { getNotificationsService, markAsReadService, deleteNotificationService } = require('../services/notificationsService');

// Get notifications for the logged-in user (most recent first)
exports.getNotifications = async (req, res) => {
  try {
    const result = await getNotificationsService({ userId: req.user._id, page: req.query.page, limit: req.query.limit });
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
};

// Mark notifications as read (accepts array of notification IDs)
exports.markAsRead = async (req, res) => {
  try {
    const result = await markAsReadService({ userId: req.user._id, notificationIds: req.body.notificationIds });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error marking notifications as read', error: err.message });
  }
};

// Delete a notification (soft delete)
exports.deleteNotification = async (req, res) => {
  try {
    const result = await deleteNotificationService({ userId: req.user._id, id: req.params.id });
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error deleting notification', error: err.message });
  }
}; 