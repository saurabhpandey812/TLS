const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createPost, getAllPosts, getPostsByUser } = require('../controllers/postController');
const requireAuth = require('../middleware/requireAuth');

// Multer setup for local temp storage before Cloudinary upload
const upload = multer({
  dest: 'uploads/',
  limits: { files: 20, fileSize: 50 * 1024 * 1024 }, // up to 20 files, 50MB each
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'video/mp4', 'video/quicktime', 'video/x-matroska'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image and video files are allowed!'));
  },
});

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post with multiple images or videos
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *                 example: "My awesome trip!"
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: "Upload up to 12 images or videos."
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Bad request (missing media or too many files)
 *       500:
 *         description: Server error
 */
router.post('/', requireAuth, upload.array('media', 12), createPost);

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts (newest first)
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of posts
 *       500:
 *         description: Server error
 */
router.get('/', getAllPosts);

/**
 * @swagger
 * /api/posts/user/{userId}:
 *   get:
 *     summary: Get all posts by a specific user (newest first)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user's posts
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', getPostsByUser);

module.exports = router; 