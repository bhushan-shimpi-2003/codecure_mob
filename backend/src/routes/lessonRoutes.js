const express = require('express');
const { getLessons, getLatestLesson, createLesson, updateLesson, deleteLesson } = require('../controllers/lessonController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/course/:courseId', protect, getLessons);
router.get('/course/:courseId/latest', protect, getLatestLesson);
router.post('/', protect, authorize('teacher', 'admin'), createLesson);
router.put('/:id', protect, authorize('teacher', 'admin'), updateLesson);
router.patch('/:id', protect, authorize('teacher', 'admin'), updateLesson);

router.delete('/:id', protect, authorize('teacher', 'admin'), deleteLesson);

module.exports = router;
