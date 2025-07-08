const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const requireAuth = require('../middleware/requireAuth');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for the logged-in user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', requireAuth, notificationsController.getNotifications);

/**
 * @swagger
 * /api/notifications/mark-read:
 *   put:
 *     summary: Mark notifications as read
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       400:
 *         description: Bad request
 */
router.put('/mark-read', requireAuth, notificationsController.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', requireAuth, notificationsController.deleteNotification);

module.exports = router; 