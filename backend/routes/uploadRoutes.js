const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/uploadController');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

router.post('/single', protect, upload.single('file'), ctrl.uploadFile);
router.post('/multiple', protect, upload.array('files', 10), ctrl.uploadMultiple);
// Public file retrieval (streams from GridFS)
router.get('/file/:id', ctrl.getFileById);
// Resume management (stored in GridFS; legacy assets/images read fallback)
router.post('/resume', protect, upload.single('file'), ctrl.uploadResume);
router.get('/resume', ctrl.getResumeInfo);
router.get('/resume/download', ctrl.downloadLatestResume);
// Delete by id or filename (protected)
router.delete('/:filename', protect, ctrl.deleteFile);

module.exports = router;
