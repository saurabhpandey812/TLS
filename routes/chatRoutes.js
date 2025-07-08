const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

/**
 * @swagger
 * /api/chat/messages:
 *   post:
 *     summary: Send a chat message
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *       400:
 *         description: Bad request
 */
router.post('/messages', chatController.sendMessage);

/**
 * @swagger
 * /api/chat/messages:
 *   get:
 *     summary: Get chat messages
 *     tags: [Chat]
 *     parameters:
 *       - in: query
 *         name: with
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/messages', chatController.getMessages);

module.exports = router; 