const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');
require('dotenv').config();

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Try to find user in Profile model first
    let user = await Profile.findById(decoded.userId || decoded._id);
    if (!user) {
      // fallback: try to use decoded as user object
      user = decoded;
    }
    req.user = user;
    if (decoded._id) {
      req.user._id = decoded._id;
    } else if (decoded.userId) {
      req.user._id = decoded.userId;
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized', error: error.message });
  }
};

module.exports = requireAuth;
