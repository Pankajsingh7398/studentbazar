import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required.');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long.');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(400, 'An account with this email address already exists.');
  }

  // Customers cannot assign admin role
  const user = new User({
    name,
    email: email.toLowerCase(),
    passwordHash: password,
    phone,
    role: 'customer'
  });

  await user.save();

  const token = user.generateAccessToken();
  const createdUser = await User.findById(user._id).select('-passwordHash');

  return res
    .status(201)
    .cookie('token', token, COOKIE_OPTIONS)
    .json(new ApiResponse(201, 'Scholar account created successfully!', { user: createdUser, token }));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please provide both email and password.');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account is deactivated. Contact campus support.');
  }

  const token = user.generateAccessToken();
  const userResponse = await User.findById(user._id).select('-passwordHash');

  return res
    .status(200)
    .cookie('token', token, COOKIE_OPTIONS)
    .json(new ApiResponse(200, 'Logged in successfully!', { user: userResponse, token }));
});

export const logout = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie('token', COOKIE_OPTIONS)
    .json(new ApiResponse(200, 'Logged out successfully.'));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, 'Current user profile fetched.', { user: req.user }));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, addresses } = req.body;

  const updates = {};
  if (name) updates.name = name.trim();
  if (phone) updates.phone = phone.trim();
  if (addresses && Array.isArray(addresses)) updates.addresses = addresses;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-passwordHash');

  return res
    .status(200)
    .json(new ApiResponse(200, 'Profile updated successfully.', { user: updatedUser }));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Both current and new password are required.');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters.');
  }

  const user = await User.findById(req.user._id).select('+passwordHash');
  const isMatch = await user.isPasswordCorrect(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Current password does not match.');
  }

  user.passwordHash = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, 'Password changed successfully.'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  // Security rule: Do not disclose whether account exists
  return res
    .status(200)
    .json(new ApiResponse(200, 'If an account exists with this email, a reset link has been dispatched.'));
});

/**
 * Admin Passkey Authentication
 * Verifies against ADMIN_PASSKEY env variable or hashed passkey in User model
 */
export const adminLogin = asyncHandler(async (req, res) => {
  const { passkey, email } = req.body;

  if (!passkey || typeof passkey !== 'string') {
    throw new ApiError(400, 'Admin passkey is required.');
  }

  const configuredPasskey = process.env.ADMIN_PASSKEY;
  let adminUser = null;

  if (email) {
    adminUser = await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' }).select('+adminPasskeyHash');
  } else {
    adminUser = await User.findOne({ role: 'admin' }).select('+adminPasskeyHash');
  }

  let isValid = false;

  // 1. Check against DB hashed passkey if exists
  if (adminUser && adminUser.adminPasskeyHash) {
    isValid = await bcrypt.compare(passkey, adminUser.adminPasskeyHash);
  }

  // 2. Fallback to configured ADMIN_PASSKEY env variable
  if (!isValid && configuredPasskey && passkey === configuredPasskey) {
    isValid = true;
  }

  if (!isValid) {
    throw new ApiError(401, 'Invalid admin passkey. Access denied.');
  }

  // Auto-provision primary administrator if not exists yet
  if (!adminUser) {
    const defaultEmail = (process.env.ADMIN_EMAIL || 'admin@studentbazaar.com').toLowerCase();
    adminUser = await User.findOne({ email: defaultEmail });
    if (!adminUser) {
      adminUser = new User({
        name: 'Store Administrator',
        email: defaultEmail,
        role: 'admin',
        phone: process.env.ADMIN_WHATSAPP_NUMBER || '918429172879',
        isActive: true
      });
    } else {
      adminUser.role = 'admin';
    }
  }

  // Persist passkey hash to database for security
  adminUser.adminPasskeyHash = await bcrypt.hash(passkey, 12);
  adminUser.role = 'admin';
  await adminUser.save();

  const token = adminUser.generateAccessToken();
  const userResponse = await User.findById(adminUser._id).select('-passwordHash -adminPasskeyHash');

  return res
    .status(200)
    .cookie('token', token, COOKIE_OPTIONS)
    .json(new ApiResponse(200, 'Admin authenticated successfully with passkey.', { user: userResponse, token }));
});

/**
 * Change Admin Passkey
 */
export const changeAdminPasskey = asyncHandler(async (req, res) => {
  const { currentPasskey, newPasskey } = req.body;

  if (!currentPasskey || !newPasskey) {
    throw new ApiError(400, 'Both current and new admin passkeys are required.');
  }

  if (newPasskey.length < 8) {
    throw new ApiError(400, 'New passkey must be at least 8 characters in length.');
  }

  const adminUser = await User.findById(req.user._id).select('+adminPasskeyHash');
  if (!adminUser || adminUser.role !== 'admin') {
    throw new ApiError(403, 'Forbidden. Only administrators can perform this action.');
  }

  let isMatch = false;
  if (adminUser.adminPasskeyHash) {
    isMatch = await bcrypt.compare(currentPasskey, adminUser.adminPasskeyHash);
  }
  if (!isMatch && process.env.ADMIN_PASSKEY && currentPasskey === process.env.ADMIN_PASSKEY) {
    isMatch = true;
  }

  if (!isMatch) {
    throw new ApiError(401, 'Current admin passkey does not match.');
  }

  adminUser.adminPasskeyHash = await bcrypt.hash(newPasskey, 12);
  await adminUser.save();

  const newToken = adminUser.generateAccessToken();

  return res
    .status(200)
    .cookie('token', newToken, COOKIE_OPTIONS)
    .json(new ApiResponse(200, 'Admin passkey updated successfully.'));
});

