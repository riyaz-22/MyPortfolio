const path = require('path');
const fs = require('fs');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

// ── Upload single file (image / resume) — store in GridFS ─────────
const mongoose = require('mongoose');

exports.uploadFile = asyncHandler(async (req, res) => {
     if (!req.file) throw new ApiError(400, 'No file uploaded');

     const db = mongoose.connection.db;
     const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

     // Stream buffer to GridFS
     const uploadStream = bucket.openUploadStream(req.file.originalname, {
          contentType: req.file.mimetype,
     });

     await new Promise((resolve, reject) => {
          uploadStream.on('error', reject);
          uploadStream.on('finish', () => resolve(uploadStream.id));
          uploadStream.end(req.file.buffer);
     });

     const fileId = uploadStream.id;
     const fileUrl = `/api/uploads/file/${fileId}`; // public retrieval route

     sendResponse(res, 200, {
          fileId: fileId.toString(),
          originalName: req.file.originalname,
          fileUrl,
          size: req.file.size,
          mimetype: req.file.mimetype,
     }, 'File uploaded successfully');
});

// ── Upload multiple files (stream each to GridFS) ────────────────
exports.uploadMultiple = asyncHandler(async (req, res) => {
     if (!req.files || req.files.length === 0) {
          throw new ApiError(400, 'No files uploaded');
     }

     const mongoose = require('mongoose');
     const db = mongoose.connection.db;
     const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

     const results = [];

     for (const f of req.files) {
          const uploadStream = bucket.openUploadStream(f.originalname, { contentType: f.mimetype });
          await new Promise((resolve, reject) => {
               uploadStream.on('error', reject);
               uploadStream.on('finish', () => resolve(uploadStream.id));
               uploadStream.end(f.buffer);
          });
          results.push({ fileId: uploadStream.id.toString(), originalName: f.originalname, fileUrl: `/api/uploads/file/${uploadStream.id}`, size: f.size, mimetype: f.mimetype });
     }

     sendResponse(res, 200, results, 'Files uploaded successfully');
});

// ── Serve a file stored in GridFS by id ───────────────────────────
exports.getFileById = asyncHandler(async (req, res) => {
     const { id } = req.params;
     if (!id) throw new ApiError(400, 'File id is required');

     const mongoose = require('mongoose');
     const db = mongoose.connection.db;
     const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

     let _id;
     try { _id = new mongoose.Types.ObjectId(id); } catch (err) { throw new ApiError(400, 'Invalid file id'); }

     const downloadStream = bucket.openDownloadStream(_id);
     downloadStream.on('error', () => { res.status(404).json({ success: false, message: 'File not found' }); });
     downloadStream.pipe(res);
});

// ── Delete a file (by id) ───────────────────────────────────────
exports.deleteFile = asyncHandler(async (req, res) => {
     const { filename } = req.params; // legacy param name — accept id or filename

     const mongoose = require('mongoose');
     const db = mongoose.connection.db;
     const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });

     // If param looks like an ObjectId, delete by id
     if (/^[0-9a-fA-F]{24}$/.test(filename)) {
          await bucket.delete(new mongoose.Types.ObjectId(filename));
          sendResponse(res, 200, null, 'File deleted');
          return;
     }

     // Otherwise try to find by filename and delete first match
     const files = await db.collection('uploads.files').find({ filename }).limit(1).toArray();
     if (!files || files.length === 0) throw new ApiError(404, 'File not found');
     await bucket.delete(files[0]._id);
     sendResponse(res, 200, null, 'File deleted');
});
