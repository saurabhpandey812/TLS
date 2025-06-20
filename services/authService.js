const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (user) => {
  const payload = {
    userId: user._id,
    name: user.name,
    email: user.email,
  };

  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  const token = jwt.sign(payload, secret, { expiresIn });
  return token;
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error };
  }
};

module.exports = {generateToken,verifyToken}