const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');




/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               mobile:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: Email or mobile already exists
 */
router.post('/signup', signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       404:
 *         description: User not found or password incorrect
 */
router.post('/login', login);

/**
 * @swagger
 * /api/protected:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Protected route
 *     tags: [Protected]
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */

module.exports = router;
