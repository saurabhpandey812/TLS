const express = require('express');
const router = express.Router();
const { signup, login, verifyEmailOtp, verifyMobileOtp, resendOtp } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API for user authentication and verification
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user with email or mobile verification
 *     tags: [Authentication]
 *     description: >
 *       Initiates registration by sending OTP to either email or mobile.
 *       Provide either email or mobile (with country code like +91).
 *       If user already exists but unverified, it will resend OTP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               mobile:
 *                 type: string
 *                 example: "+918804208836"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Bad request (missing required fields or already verified)
 *       500:
 *         description: Server error
 */
router.post('/signup', signup);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-email', verifyEmailOtp);

/**
 * @swagger
 * /api/auth/verify-mobile:
 *   post:
 *     summary: Verify mobile with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *               - otp
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "+918804208836"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Mobile verified successfully
 *       400:
 *         description: Invalid OTP
 *       404:
 *         description: User not found
 */
router.post('/verify-mobile', verifyMobileOtp);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email or mobile
 *     tags: [Authentication]
 *     description: Login using either email or mobile number along with password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               mobile:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account not verified
 *       404:
 *         description: User not found
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend email OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: New OTP sent successfully
 *       400:
 *         description: Email required or account already verified
 *       404:
 *         description: Email not registered
 */
router.post('/resend-otp', resendOtp);

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

router.get('/validate-token', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;