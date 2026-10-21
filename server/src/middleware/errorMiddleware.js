import { ApiError } from '../utils/apiError.js';

/**
 * Global Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Normalize non-ApiError instances
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new ApiError(400, `An account or record with that ${field} already exists.`);
  }

  // Handle Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new ApiError(400, `Resource not found with specified identifier (${err.value}).`);
  }

  // Handle JSON Web Token errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token. Please sign in again.');
  }
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired. Please sign in again.');
  }

  const response = {
    success: false,
    statusCode: error.statusCode || 500,
    message: error.message,
    errors: error.errors || []
  };

  // Only include stack trace in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }

  return res.status(error.statusCode || 500).json(response);
};
