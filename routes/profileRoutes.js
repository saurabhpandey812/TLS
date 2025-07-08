const express = require('express');
const router = express.Router();
const multer = require('multer');
const { register, login, getProfile, updateAvatar, updateProfile } = require('../controllers/profileController');
const requireAuth = require('../middleware/requireAuth');
const profileController = require('../controllers/profileController');
const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * /api/profile/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Bad request
 */
router.post('/register', register);

/**
 * @swagger
 * /api/profile/login:
 *   post:
 *     summary: Login user
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/profile/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: User not found
 */
router.get('/:id', getProfile);

/**
 * @swagger
 * /api/profile/avatar:
 *   patch:
 *     summary: Update user profile picture (avatar)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Server error
 */
router.patch('/avatar', requireAuth, upload.single('avatar'), updateAvatar);

/**
 * @swagger
 * /api/profile/update:
 *   patch:
 *     summary: Update user profile fields
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               website:
 *                 type: string
 *               gender:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: No valid fields to update
 *       500:
 *         description: Server error
 */
router.patch('/update', requireAuth, updateProfile);

module.exports = router;