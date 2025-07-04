const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normalize user id field
    req.user = decoded;
    if (decoded._id) {
      req.user._id = decoded._id;
    } else if (decoded.userId) {
      req.user._id = decoded.userId;
    }
    // Debug log
    console.log('Authenticated user:', req.user);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}; 