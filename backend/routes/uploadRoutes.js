const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/uploadController');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

router.post('/single', protect, upload.single('file'), ctrl.uploadFile);
router.post('/multiple', protect, upload.array('files', 10), ctrl.uploadMultiple);
// Public file retrieval (streams from GridFS)
router.get('/file/:id', ctrl.getFileById);
// Resume management (store resume in assets/images)
router.post('/resume', protect, upload.single('file'), ctrl.uploadResume);
router.get('/resume', ctrl.getResumeInfo);
// Delete by id or filename (protected)
router.delete('/:filename', protect, ctrl.deleteFile);

module.exports = router;
