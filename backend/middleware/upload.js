const path = require('path');
const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Storage config
const storage = multer.diskStorage({
     destination(_req, _file, cb) {
          cb(null, path.join(__dirname, '..', 'uploads'));
     },
     filename(_req, file, cb) {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = path.extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
     },
});

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
