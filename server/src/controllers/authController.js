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
