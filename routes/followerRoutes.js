const express = require('express');
const router = express.Router();
const followerController = require('../controllers/followerController');
const { requireAuth } = require('../services/authService');

// Send follow request
router.post('/request/:targetUserId', requireAuth, followerController.sendFollowRequest);

// Accept follow request
router.post('/accept/:followerId', requireAuth, followerController.acceptFollowRequest);

// Reject follow request
router.post('/reject/:followerId', requireAuth, followerController.rejectFollowRequest);

// Unfollow user
router.delete('/unfollow/:targetUserId', requireAuth, followerController.unfollowUser);

// Get pending follow requests for the logged-in user
router.get('/pending', requireAuth, followerController.getPendingFollowRequests);

// Get followers of a user
router.get('/followers/:targetUserId', requireAuth, followerController.getFollowers);

// Get following of a user
router.get('/following/:targetUserId', requireAuth, followerController.getFollowing);

// Check follow status between logged-in user and target user
router.get('/status/:targetUserId', requireAuth, followerController.checkFollowStatus);

// Remove a follower
router.delete('/remove/:followerId', requireAuth, followerController.removeFollower);

module.exports = router; 