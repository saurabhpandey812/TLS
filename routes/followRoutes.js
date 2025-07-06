const express = require('express');
const router = express.Router();
const { followUser, unfollowUser, getFollowers, getFollowing, acceptRequest, rejectRequest, getPendingRequests } = require('../controllers/followController');
const requireAuth = require('../middleware/requireAuth');

/**
 * @swagger
 * /api/follow/{userId}:
 *   post:
 *     summary: Follow a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Followed or request sent
 *       400:
 *         description: Already requested/following or cannot follow self
 *       500:
 *         description: Server error
 */
router.post('/:userId', requireAuth, followUser);

/**
 * @swagger
 * /api/follow/{userId}:
 *   delete:
 *     summary: Unfollow a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unfollowed successfully
 *       400:
 *         description: Not following
 *       500:
 *         description: Server error
 */
router.delete('/:userId', requireAuth, unfollowUser);

/**
 * @swagger
 * /api/follow/accept/{followerId}:
 *   post:
 *     summary: Accept a follow request (private user only)
 *     tags: [Follow]
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
 *         description: No pending request found
 *       500:
 *         description: Server error
 */
router.post('/accept/:followerId', requireAuth, acceptRequest);

/**
 * @swagger
 * /api/follow/reject/{followerId}:
 *   post:
 *     summary: Reject a follow request (private user only)
 *     tags: [Follow]
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
 *         description: No pending request found
 *       500:
 *         description: Server error
 */
router.post('/reject/:followerId', requireAuth, rejectRequest);

/**
 * @swagger
 * /api/follow/pending:
 *   get:
 *     summary: Get pending follow requests (private user only)
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending requests
 *       500:
 *         description: Server error
 */
router.get('/pending', requireAuth, getPendingRequests);

/**
 * @swagger
 * /api/followers/{userId}:
 *   get:
 *     summary: Get followers of a user
 *     tags: [Follow]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of followers
 *       500:
 *         description: Server error
 */
router.get('/followers/:userId', getFollowers);

/**
 * @swagger
 * /api/following/{userId}:
 *   get:
 *     summary: Get following of a user
 *     tags: [Follow]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of following
 *       500:
 *         description: Server error
 */
router.get('/following/:userId', getFollowing);

module.exports = router; 