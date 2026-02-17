const ApiError = require('../utils/ApiError');

// Handle Mongoose CastError (invalid ObjectId)
const handleCastError = (err) =>
     new ApiError(400, `Invalid ${err.path}: ${err.value}`);

// Handle Mongoose duplicate key
const handleDuplicateKey = (err) => {
     const field = Object.keys(err.keyValue).join(', ');
     return new ApiError(409, `Duplicate value for field(s): ${field}`);
};

// Handle Mongoose ValidationError
const handleValidationError = (err) => {
     const messages = Object.values(err.errors).map((e) => e.message);
     return new ApiError(400, `Validation failed: ${messages.join('. ')}`);
};

/**
 * Global error-handling middleware.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
     let error = { ...err, message: err.message };

     // Mongoose errors
     if (err.name === 'CastError') error = handleCastError(err);
     if (err.code === 11000) error = handleDuplicateKey(err);
     if (err.name === 'ValidationError') error = handleValidationError(err);

     const statusCode = error.statusCode || 500;
     const message = error.message || 'Internal Server Error';

     res.status(statusCode).json({
          success: false,
          status: error.status || 'error',
          message,
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
     });
};

module.exports = errorHandler;
