import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Try to find user in DB, fallback to decoded token data
    let user;
    try {
      user = await User.findById(decoded.userId);
    } catch (dbErr) {
      // DB not available — use token data
      user = { _id: decoded.userId, email: decoded.email, name: decoded.name };
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      try {
        req.user = await User.findById(decoded.userId);
      } catch {
        req.user = { _id: decoded.userId, email: decoded.email };
      }
    }
  } catch {
    // Not authenticated — that's fine
  }
  next();
};
