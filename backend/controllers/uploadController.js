const path = require('path');
const fs = require('fs');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

// ── Upload single file (image / resume) ──────────────────────────
exports.uploadFile = asyncHandler(async (req, res) => {
     if (!req.file) throw new ApiError(400, 'No file uploaded');

     const fileUrl = `/uploads/${req.file.filename}`;
     sendResponse(res, 200, {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileUrl,
          size: req.file.size,
          mimetype: req.file.mimetype,
     }, 'File uploaded successfully');
});

// ── Upload multiple images ───────────────────────────────────────
exports.uploadMultiple = asyncHandler(async (req, res) => {
     if (!req.files || req.files.length === 0) {
          throw new ApiError(400, 'No files uploaded');
     }

     const files = req.files.map((f) => ({
          fileName: f.filename,
          originalName: f.originalname,
          fileUrl: `/uploads/${f.filename}`,
          size: f.size,
          mimetype: f.mimetype,
     }));

     sendResponse(res, 200, files, 'Files uploaded successfully');
});

// ── Delete a file ────────────────────────────────────────────────
exports.deleteFile = asyncHandler(async (req, res) => {
     const { filename } = req.params;
     const filePath = path.join(__dirname, '..', 'uploads', filename);

     if (!fs.existsSync(filePath)) {
          throw new ApiError(404, 'File not found');
     }

     fs.unlinkSync(filePath);
     sendResponse(res, 200, null, 'File deleted');
});
