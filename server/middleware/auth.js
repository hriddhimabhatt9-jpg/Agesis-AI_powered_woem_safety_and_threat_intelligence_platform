import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import demoStore from '../utils/demoStore.js';


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
      // DB not available — try demo store, fallback to decoded token data
      user = demoStore.getById(decoded.userId) || { _id: decoded.userId, email: decoded.email, name: decoded.name };
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', tokenExpired: true });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(401).json({ error: 'Authentication failed' });
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
        req.user = demoStore.getById(decoded.userId) || { _id: decoded.userId, email: decoded.email };
      }
    }
  } catch {
    // Not authenticated — that's fine for optional auth
  }
  next();
};
