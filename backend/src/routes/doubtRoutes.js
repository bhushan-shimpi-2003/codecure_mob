const express = require('express');
const { createDoubt, getMyDoubts, getTeacherDoubts, getAllDoubts, resolveDoubt, updateDoubt, deleteDoubt } = require('../controllers/doubtController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, authorize('student'), createDoubt);
router.put('/:id', protect, authorize('student'), updateDoubt);
router.patch('/:id', protect, authorize('student'), updateDoubt);
router.delete('/:id', protect, authorize('student'), deleteDoubt);
router.get('/me', protect, authorize('student'), getMyDoubts);
router.get('/teacher', protect, authorize('teacher'), getTeacherDoubts);
router.get('/', protect, authorize('admin'), getAllDoubts);
router.put('/:id/resolve', protect, authorize('teacher', 'admin'), resolveDoubt);
router.patch('/:id/resolve', protect, authorize('teacher', 'admin'), resolveDoubt);

module.exports = router;
