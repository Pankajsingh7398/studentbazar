import jwt from 'jsonwebtoken';
import { clerkClient } from '@clerk/express';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';

/**
 * Middleware to verify authenticated session from Clerk or legacy JWT cookie/Bearer
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  // 1. Check if authenticated via Clerk (from Clerk middleware or Authorization header)
  if (req.auth && req.auth.userId) {
    let user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) {
      // Auto-provision or link user by email from Clerk
      try {
        const clerkUser = await clerkClient.users.getUser(req.auth.userId);
        const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.clerkId = req.auth.userId;
            await user.save();
          } else {
            user = await User.create({
              clerkId: req.auth.userId,
              name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Scholar',
              email: email,
              emailVerified: true
            });
          }
        }
      } catch (err) {
        console.warn('[Clerk] Could not fetch user details from Clerk API:', err.message);
      }
    }

    if (user) {
      if (!user.isActive) {
        throw new ApiError(403, 'Your account has been deactivated. Please contact campus support.');
      }
      req.user = user;
      return next();
    }
  }

  // 2. Fallback to standard StudentBazaar JWT token (cookie or header)
  const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'studentbazaar_default_secret');
    const user = await User.findById(decodedToken.id).select('-passwordHash');

    if (!user) {
      throw new ApiError(401, 'User account no longer exists or token is invalid.');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account has been deactivated. Please contact campus support.');
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid or expired access token.');
  }
});

/**
 * Optional authentication: attaches user if token is present and valid, otherwise proceeds as guest
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'studentbazaar_default_secret');
    const user = await User.findById(decodedToken.id).select('-passwordHash');
    req.user = user && user.isActive ? user : null;
  } catch (e) {
    req.user = null;
  }
  next();
});

/**
 * Role-Based Access Control Middleware
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Access denied. Requires one of [${roles.join(', ')}] permissions.`);
    }

    next();
  };
};
