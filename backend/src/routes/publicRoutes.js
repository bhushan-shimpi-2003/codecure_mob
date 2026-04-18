const express = require('express');
const { submitContactMessage, getContactMessages, submitFeedback, getJobOpenings, createJobOpening, deleteJobOpening } = require('../controllers/publicController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Contact (public)
router.post('/contact', submitContactMessage);
router.get('/contact', protect, authorize('admin'), getContactMessages);

// Feedback (student submit)
router.post('/feedback', protect, authorize('student'), submitFeedback);

// Job Openings
router.get('/jobs', protect, getJobOpenings);
router.post('/jobs', protect, authorize('admin', 'teacher'), createJobOpening);
router.delete('/jobs/:id', protect, authorize('admin', 'teacher'), deleteJobOpening);

module.exports = router;
