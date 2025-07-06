const express = require('express');
const router = express.Router();
const { likePost, unlikePost, getLikesForPost } = require('../controllers/likeController');
const requireAuth = require('../middleware/requireAuth');

/**
 * @swagger
 * /api/like/{postId}:
 *   post:
 *     summary: Like a post
 *     tags: [Like]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post liked
 *       400:
 *         description: Already liked
 *       500:
 *         description: Server error
 */
router.post('/:postId', requireAuth, likePost);

/**
 * @swagger
 * /api/like/{postId}:
 *   delete:
 *     summary: Unlike a post
 *     tags: [Like]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post unliked
 *       400:
 *         description: Not liked yet
 *       500:
 *         description: Server error
 */
router.delete('/:postId', requireAuth, unlikePost);

/**
 * @swagger
 * /api/like/{postId}:
 *   get:
 *     summary: Get all users who liked a post
 *     tags: [Like]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users who liked the post
 *       500:
 *         description: Server error
 */
router.get('/:postId', getLikesForPost);

module.exports = router; 