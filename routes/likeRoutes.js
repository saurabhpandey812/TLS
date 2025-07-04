const express = require('express');
const router = express.Router();
const { likePost, unlikePost } = require('../controllers/likeController');
const requireAuth = require('../middleware/requireAuth');

/**
 * @swagger
 * /api/like/{postId}/like:
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
router.post('/:postId/like', requireAuth, likePost);

/**
 * @swagger
 * /api/like/{postId}/like:
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
router.delete('/:postId/like', requireAuth, unlikePost);

module.exports = router; 