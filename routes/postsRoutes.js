const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const requireAuth = require('../middleware/requireAuth');

// Like a post
router.post('/posts/:id/like', requireAuth, postsController.likePost);
// Unlike a post
router.delete('/posts/:id/unlike', requireAuth, postsController.unlikePost);
// Get all users who liked a post
router.get('/posts/:id/likes', requireAuth, postsController.getPostLikes);
// Create a new post
router.post('/posts', requireAuth, postsController.createPost);
// Get all posts
router.get('/posts', postsController.getAllPosts);
// Get a single post by ID
router.get('/posts/:id', postsController.getPostById);
// Comments endpoints
router.get('/posts/:id/comments', postsController.getComments);
router.post('/posts/:id/comments', requireAuth, postsController.addComment);
router.delete('/posts/:id/comments/:commentId', requireAuth, postsController.deleteComment);
// Comment likes
router.post('/posts/:postId/comments/:commentId/like', requireAuth, postsController.likeComment);
router.delete('/posts/:postId/comments/:commentId/unlike', requireAuth, postsController.unlikeComment);
// Comment replies
router.post('/posts/:postId/comments/:commentId/replies', requireAuth, postsController.addReply);
router.delete('/posts/:postId/comments/:commentId/replies/:replyId', requireAuth, postsController.deleteReply);
// Reshare a post
router.post('/posts/:id/reshare', requireAuth, postsController.resharePost);

module.exports = router; 