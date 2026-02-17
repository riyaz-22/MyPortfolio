const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

const signToken = (id) =>
     jwt.sign({ id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
     });

// ── Register (first-time setup only) ────────────────────────────
exports.register = asyncHandler(async (req, res) => {
     const count = await User.countDocuments();
     if (count > 0) {
          throw new ApiError(403, 'Admin account already exists. Use login.');
     }

     const { name, email, password } = req.body;
     const user = await User.create({ name, email, password, role: 'admin' });
     const token = signToken(user._id);

     sendResponse(
          res,
          201,
          { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token },
          'Admin account created'
     );
});

// ── Login ────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
     const { email, password } = req.body;

     if (!email || !password) {
          throw new ApiError(400, 'Email and password are required');
     }

     const user = await User.findOne({ email }).select('+password');
     if (!user || !(await user.comparePassword(password))) {
          throw new ApiError(401, 'Invalid email or password');
     }

     const token = signToken(user._id);

     sendResponse(
          res,
          200,
          { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token },
          'Login successful'
     );
});

// ── Get current user ─────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
     sendResponse(res, 200, req.user, 'User fetched');
});

// ── Change password ──────────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res) => {
     const { currentPassword, newPassword } = req.body;

     const user = await User.findById(req.user._id).select('+password');
     if (!(await user.comparePassword(currentPassword))) {
          throw new ApiError(401, 'Current password is incorrect');
     }

     user.password = newPassword;
     await user.save();

     const token = signToken(user._id);
     sendResponse(res, 200, { token }, 'Password changed successfully');
});
