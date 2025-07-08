const express = require('express');
const router = express.Router();
const followerController = require('../controllers/followerController');
const { requireAuth } = require('../services/authService');

/**
 * @swagger
 * /api/follower/request/{targetUserId}:
 *   post:
 *     summary: Send follow request
 *     tags: [Follower]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow request sent
 *       400:
 *         description: Bad request
 */
router.post('/request/:targetUserId', requireAuth, followerController.sendFollowRequest);

/**
 * @swagger
 * /api/follower/accept/{followerId}:
 *   post:
 *     summary: Accept follow request
 *     tags: [Follower]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request accepted
 *       404:
 *         description: Request not found
 */
router.post('/accept/:followerId', requireAuth, followerController.acceptFollowRequest);

/**
 * @swagger
 * /api/follower/reject/{followerId}:
 *   post:
 *     summary: Reject follow request
 *     tags: [Follower]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request rejected
 *       404:
 *         description: Request not found
 */
router.post('/reject/:followerId', requireAuth, followerController.rejectFollowRequest);

/**
 * @swagger
 * /api/follower/unfollow/{targetUserId}:
 *   delete:
 *     summary: Unfollow user
 *     tags: [Follower]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unfollowed successfully
 *       400:
 *         description: Not following
 */
router.delete('/unfollow/:targetUserId', requireAuth, followerController.unfollowUser);

/**
 * @swagger
 * /api/follower/pending:
 *   get:
 *     summary: Get pending follow requests
 *     tags: [Follower]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending requests
 */
router.get('/pending', requireAuth, followerController.getPendingFollowRequests);

/**
 * @swagger
 * /api/follower/followers/{targetUserId}:
 *   get:
 *     summary: Get followers of a user
 *     tags: [Follower]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of followers
 */
router.get('/followers/:targetUserId', requireAuth, followerController.getFollowers);

/**
 * @swagger
 * /api/follower/following/{targetUserId}:
 *   get:
 *     summary: Get following of a user
 *     tags: [Follower]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of following
 */
router.get('/following/:targetUserId', requireAuth, followerController.getFollowing);

/**
 * @swagger
 * /api/follower/status/{targetUserId}:
 *   get:
 *     summary: Check follow status
 *     tags: [Follower]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow status
 */
router.get('/status/:targetUserId', requireAuth, followerController.checkFollowStatus);

/**
 * @swagger
 * /api/follower/remove/:followerId:
 *   delete:
 *     summary: Remove a follower
 *     tags: [Follower]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follower removed
 *       404:
 *         description: Follower not found
 */
router.delete('/remove/:followerId', requireAuth, followerController.removeFollower);

module.exports = router; 