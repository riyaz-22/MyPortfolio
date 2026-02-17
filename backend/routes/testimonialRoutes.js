const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/testimonialController');
const { protect } = require('../middleware/auth');

router.get('/', ctrl.getAll);                           // public
router.post('/', protect, ctrl.create);
router.patch('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.remove);
router.patch('/reorder/bulk', protect, ctrl.reorder);

module.exports = router;
