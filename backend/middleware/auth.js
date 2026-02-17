const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('./asyncHandler');

/**
 * Protect routes – verify JWT and attach user to req.
 */
exports.protect = asyncHandler(async (req, _res, next) => {
     let token;

     if (
          req.headers.authorization &&
          req.headers.authorization.startsWith('Bearer')
     ) {
          token = req.headers.authorization.split(' ')[1];
     }

     if (!token) {
          throw new ApiError(401, 'Not authorised – no token provided');
     }

     try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = await User.findById(decoded.id);
          if (!req.user) throw new ApiError(401, 'User no longer exists');
          next();
     } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(401, 'Not authorised – invalid token');
     }
});

/**
 * Restrict to specific roles.
 */
exports.restrictTo =
     (...roles) =>
          (req, _res, next) => {
               if (!roles.includes(req.user.role)) {
                    throw new ApiError(403, 'You do not have permission for this action');
               }
               next();
          };
