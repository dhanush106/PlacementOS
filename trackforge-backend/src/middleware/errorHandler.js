import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
    details: err.details
  });

  // Handle Mongoose/MongoDB duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      status: 'error',
      error: {
        code: 'CONFLICT',
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        details: { [field]: 'Already registered' }
      }
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const details = {};
    Object.keys(err.errors).forEach((key) => {
      details[key] = err.errors[key].message;
    });
    return res.status(400).json({
      status: 'error',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details
      }
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token. Please log in again.'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please log in again.'
      }
    });
  }

  // Handle custom application errors (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      error: {
        code: err.code || 'APP_ERROR',
        message: err.message,
        details: err.details
      }
    });
  }

  // Fallback for unhandled/internal server errors
  return res.status(err.statusCode).json({
    status: 'error',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong on the server',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};
