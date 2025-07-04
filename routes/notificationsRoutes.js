const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const requireAuth = require('../middleware/requireAuth');

// Get notifications for the logged-in user
router.get('/', requireAuth, notificationsController.getNotifications);
// Mark notifications as read
router.put('/mark-read', requireAuth, notificationsController.markAsRead);
// Delete a notification
router.delete('/:id', requireAuth, notificationsController.deleteNotification);

module.exports = router; 