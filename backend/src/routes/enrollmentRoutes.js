const express = require('express');
const {
  requestEnrollment, getMyRequests, getPendingRequests, resolveRequest,
  getMyEnrollments, getAllEnrollments, updateEnrollment,
  deleteEnrollment, deleteRequest,
} = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Student
router.post('/request', protect, authorize('student'), requestEnrollment);
router.get('/requests/me', protect, authorize('student'), getMyRequests);
router.delete('/requests/:id', protect, authorize('student'), deleteRequest);
router.get('/me', protect, authorize('student'), getMyEnrollments);

// Admin
router.get('/requests/pending', protect, authorize('admin'), getPendingRequests);
router.put('/requests/:id', protect, authorize('admin'), resolveRequest);
router.patch('/requests/:id', protect, authorize('admin'), resolveRequest);
router.delete('/requests/:id', protect, authorize('admin'), deleteRequest);
router.get('/', protect, authorize('admin', 'teacher'), getAllEnrollments);
router.put('/:id', protect, authorize('admin', 'teacher'), updateEnrollment);
router.patch('/:id', protect, authorize('admin', 'teacher'), updateEnrollment);
router.delete('/:id', protect, authorize('admin'), deleteEnrollment);

module.exports = router;
