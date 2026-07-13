import jwt from 'jsonwebtoken';
import { AuthError, ForbiddenError } from '../utils/errors.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_access_token_123';

export const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided. Please log in.', 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    // 2. Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.findOne({ token });
    if (isBlacklisted) {
      throw new AuthError('Session expired. Please log in again.', 'TOKEN_BLACKLISTED');
    }

    // 3. Verify token signature
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AuthError('User no longer exists.', 'USER_NOT_FOUND');
    }

    if (user.deletedAt) {
      throw new AuthError('Account is deleted.', 'USER_DELETED');
    }

    // 5. Grant access
    req.user = {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: decoded.role || 'user'
    };
    req.token = token; // store current token for blacklisting on logout

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthError('Invalid session token. Please log in again.', 'INVALID_TOKEN'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthError('Your session has expired. Please log in again.', 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
};

export const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new ForbiddenError('Admin access required.'));
  }
};
