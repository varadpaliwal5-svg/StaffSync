const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'staffsync_secret_jwt_key_2026'
      );

      req.user = await User.findById(decoded.id)
        .select('-password')
        .populate('employee');

      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: 'User not found' });
      }

      next();
    } catch (err) {
      console.error('[AuthMiddleware] Token verification failed:', err.message);
      return res
        .status(401)
        .json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user ? req.user.role : 'none'}' does not have permission to access this resource`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
