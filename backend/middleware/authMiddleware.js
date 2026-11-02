const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
return res.status(401).json({
success: false,
message: 'Access denied. Please log in.',
});
}

const token = authHeader.split(' ')[1];

try {
const decoded = jwt.verify(token, process.env.JWT_SECRET);

const user = await User.findById(decoded.userId).select('_id role');

if (!user) {
  return res.status(401).json({
    success: false,
    message: 'User not found. Please log in again.',
  });
}

req.user = {
  userId: user._id.toString(),
  role: user.role,
};

next();
} catch (error) {
  console.error('AUTH MIDDLEWARE ERROR:', error);

  return res.status(401).json({
    success: false,
    message: 'Authentication failed. Please log in again.',
  });
}
};

module.exports = authMiddleware;
