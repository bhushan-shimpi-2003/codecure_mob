const express = require('express');
const {
  createAssignment, getAssignmentsByCourse, getAllAssignments,
  submitAssignment, getMySubmissions, getMyAssignments, gradeSubmission, getSubmissionsByAssignment,
  updateAssignment, deleteAssignment, updateSubmission, deleteSubmission
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Teacher
router.post('/', protect, authorize('teacher', 'admin'), createAssignment);
router.put('/:id', protect, authorize('teacher', 'admin'), updateAssignment);
router.patch('/:id', protect, authorize('teacher', 'admin'), updateAssignment);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteAssignment);
router.get('/:id/submissions', protect, authorize('teacher', 'admin'), getSubmissionsByAssignment);

// Student
router.post('/:id/submit', protect, authorize('student'), submitAssignment);
router.put('/submissions/:id', protect, authorize('student'), updateSubmission);
router.patch('/submissions/:id', protect, authorize('student'), updateSubmission);
router.delete('/submissions/:id', protect, authorize('student'), deleteSubmission);
router.get('/my-assignments', protect, authorize('student'), getMyAssignments);
router.get('/submissions/me', protect, authorize('student'), getMySubmissions);

// Teacher grade
router.put('/submissions/:id/grade', protect, authorize('teacher', 'admin'), gradeSubmission);
router.patch('/submissions/:id/grade', protect, authorize('teacher', 'admin'), gradeSubmission);

// Shared
router.get('/course/:courseId', protect, getAssignmentsByCourse);

// Admin
router.get('/', protect, authorize('admin'), getAllAssignments);

module.exports = router;
