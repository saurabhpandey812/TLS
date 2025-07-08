const express = require('express');
const router = express.Router();
const { addComment, getCommentsForPost } = require('../controllers/commentController');
const requireAuth = require('../middleware/requireAuth');

/**
 * @swagger
 * /api/comment/{postId}/comment:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 *       400:
 *         description: Comment text is required
 *       500:
 *         description: Server error
 */
router.post('/:postId/comment', requireAuth, addComment);

/**
 * @swagger
 * /api/comment/{postId}/comments:
 *   get:
 *     summary: Get all comments for a post
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 *       500:
 *         description: Server error
 */
router.get('/:postId/comments', getCommentsForPost);

module.exports = router; 