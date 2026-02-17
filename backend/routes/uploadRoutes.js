const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/uploadController');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

router.post('/single', protect, upload.single('file'), ctrl.uploadFile);
router.post('/multiple', protect, upload.array('files', 10), ctrl.uploadMultiple);
router.delete('/:filename', protect, ctrl.deleteFile);

module.exports = router;
