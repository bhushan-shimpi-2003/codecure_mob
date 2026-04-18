const express = require('express');
const { uploadImage } = require('../controllers/uploadController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Allow students, teachers and admins to upload images
router.post('/image', protect, authorize('student', 'teacher', 'admin'), uploadImage);

module.exports = router;
