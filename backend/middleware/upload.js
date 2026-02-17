const path = require('path');
const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Use memory storage (suitable for streaming to GridFS / external storage)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (_req, file, cb) => {
     const allowedImages = /jpeg|jpg|png|gif|webp|svg/;
     const allowedDocs = /pdf|doc|docx/;
     const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

     if (allowedImages.test(ext) || allowedDocs.test(ext)) {
          cb(null, true);
     } else {
          cb(new ApiError(400, `File type .${ext} is not allowed`), false);
     }
};

const upload = multer({
     storage,
     fileFilter,
     limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = upload;
