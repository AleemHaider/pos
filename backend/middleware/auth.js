const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl
      });
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    } catch (jwtError) {
      logger.authError('unknown', jwtError, 'token_verification');
      return res.status(401).json({ 
        success: false,
        message: 'Token is not valid' 
      });
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      logger.warn('Authentication failed: User not found', {
        userId: decoded.userId,
        token: token.substring(0, 20) + '...'
      });
      return res.status(401).json({ 
        success: false,
        message: 'Token is not valid - user not found' 
      });
    }

    if (!user.isActive) {
      logger.authAttempt(user.email, false, 'Account deactivated');
      return res.status(401).json({ 
        success: false,
        message: 'User account is deactivated' 
      });
    }

    // Log successful authentication
    logger.debug('Authentication successful', {
      userId: user._id,
      email: user.email,
      role: user.role,
      duration: Date.now() - startTime
    });

    req.user = user;
    next();
  } catch (error) {
    logger.authError('unknown', error, 'middleware');
    res.status(401).json({ 
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }
    next();
  };
};

module.exports = auth;
module.exports.auth = auth;
module.exports.authorize = authorize;