const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const requireAuth = require('../middleware/requireAuth');

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [image, video]
 *     responses:
 *       201:
 *         description: Post created
 *       400:
 *         description: Bad request
 */
router.post('/', requireAuth, postsController.createPost);

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Post]
 *     responses:
 *       200:
 *         description: List of posts
 */
router.get('/', postsController.getAllPosts);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a single post by ID
 *     tags: [Post]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
router.get('/:id', postsController.getPostById);

/**
 * @swagger
 * /api/posts/{id}/reshare:
 *   post:
 *     summary: Reshare a post
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Post reshared
 *       400:
 *         description: Bad request
 */
router.post('/:id/reshare', requireAuth, postsController.resharePost);

module.exports = router; 