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
     // Build an absolute URL so stored paths work when the admin is hosted on a
     // different origin (GitHub Pages, etc.). Use request origin when available.
     const origin = (req && req.protocol && req.get && req.get('host'))
          ? `${req.protocol}://${req.get('host')}`
          : '';
     const fileUrl = origin ? `${origin}/api/uploads/file/${fileId}` : `/api/uploads/file/${fileId}`;

     sendResponse(res, 200, {
          fileId: fileId.toString(),
          originalName: req.file.originalname,
          fileUrl,
          size: req.file.size,
          mimetype: req.file.mimetype,
     }, 'File uploaded successfully');
});

// ── Upload resume and save to assets/images folder (overwrites existing resume) ──
exports.uploadResume = asyncHandler(async (req, res) => {
     if (!req.file) throw new ApiError(400, 'No file uploaded');
     const assetsDir = path.join(__dirname, '..', '..', 'assets', 'images');
     if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

     const ext = path.extname(req.file.originalname) || '.pdf';
     const filename = `resume${ext}`;
     const filePath = path.join(assetsDir, filename);

     await fs.promises.writeFile(filePath, req.file.buffer);

     const origin = (req && req.protocol && req.get && req.get('host'))
          ? `${req.protocol}://${req.get('host')}`
          : '';
     const fileUrl = origin ? `${origin}/assets/images/${filename}` : `/assets/images/${filename}`;

     sendResponse(res, 200, {
          originalName: req.file.originalname,
          fileUrl,
          size: req.file.size,
          mimetype: req.file.mimetype,
     }, 'Resume uploaded successfully');
});

// ── Return resume info (public URL) if present ─────────────────────────────────
exports.getResumeInfo = asyncHandler(async (req, res) => {
     const assetsDir = path.join(__dirname, '..', '..', 'assets', 'images');
     if (!fs.existsSync(assetsDir)) {
          sendResponse(res, 404, null, 'Resume not found');
          return;
     }

     // Look for a file named resume.* (pdf/doc/docx)
     const files = await fs.promises.readdir(assetsDir);
     const candidate = files.find(f => f.toLowerCase().startsWith('resume.'));
     if (!candidate) {
          sendResponse(res, 404, null, 'Resume not found');
          return;
     }

     const origin = (req && req.protocol && req.get && req.get('host'))
          ? `${req.protocol}://${req.get('host')}`
          : '';
     const fileUrl = origin ? `${origin}/assets/images/${candidate}` : `/assets/images/${candidate}`;

     sendResponse(res, 200, { fileUrl, filename: candidate }, 'Resume available');
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
          const origin = (req && req.protocol && req.get && req.get('host'))
               ? `${req.protocol}://${req.get('host')}`
               : '';
          const fileUrl = origin ? `${origin}/api/uploads/file/${uploadStream.id}` : `/api/uploads/file/${uploadStream.id}`;
          results.push({ fileId: uploadStream.id.toString(), originalName: f.originalname, fileUrl, size: f.size, mimetype: f.mimetype });
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

     // Look up file metadata so we can set proper headers (content-type, disposition)
     const filesColl = db.collection('uploads.files');
     const fileDoc = await filesColl.findOne({ _id });
     if (!fileDoc) throw new ApiError(404, 'File not found');

     // Set Content-Type if available
     if (fileDoc.contentType) res.setHeader('Content-Type', fileDoc.contentType);
     else res.setHeader('Content-Type', 'application/octet-stream');

     // Do not force download; let browser handle rendering based on Content-Type

     const downloadStream = bucket.openDownloadStream(_id);
     downloadStream.on('error', () => { res.status(404).json({ success: false, message: 'File not found' }); });

     // Removed download analytics logging for resume/file downloads

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
