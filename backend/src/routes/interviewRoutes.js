const express = require('express');
const {
  scheduleInterview, getMyInterviews, getTeacherInterviews, getAllInterviews, completeInterview,
  updateInterview, deleteInterview,
} = require('../controllers/interviewController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, authorize('teacher', 'admin'), scheduleInterview);
router.put('/:id', protect, authorize('teacher', 'admin'), updateInterview);
router.patch('/:id', protect, authorize('teacher', 'admin'), updateInterview);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteInterview);
router.get('/me', protect, authorize('student'), getMyInterviews);
router.get('/teacher', protect, authorize('teacher'), getTeacherInterviews);
router.get('/', protect, authorize('admin'), getAllInterviews);
router.put('/:id/complete', protect, authorize('teacher', 'admin'), completeInterview);
router.patch('/:id/complete', protect, authorize('teacher', 'admin'), completeInterview);

module.exports = router;
