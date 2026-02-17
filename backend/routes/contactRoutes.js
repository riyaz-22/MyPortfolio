const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

// Public
router.post('/submit', ctrl.submit);

// Admin
router.get('/', protect, ctrl.getAll);
router.get('/unread-count', protect, ctrl.unreadCount);
router.get('/:id', protect, ctrl.getOne);
router.patch('/:id/read', protect, ctrl.toggleRead);
router.patch('/:id/star', protect, ctrl.toggleStar);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
