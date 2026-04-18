const express = require('express');
const {
  getCourses, getCourse, createCourse, updateCourse, deleteCourse,
  getAllCoursesAdmin, getMyCourses, getModules, addModule, updateModule, deleteModule,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public - list all
router.get('/', getCourses);

// Teacher (must come BEFORE /:idOrSlug wildcard)
router.get('/teacher/my', protect, authorize('teacher', 'admin'), getMyCourses);

// Admin (must come BEFORE /:idOrSlug wildcard)
router.get('/admin/all', protect, authorize('admin'), getAllCoursesAdmin);

// Modules - specific routes before wildcards
router.put('/modules/:id', protect, authorize('teacher', 'admin'), updateModule);
router.patch('/modules/:id', protect, authorize('teacher', 'admin'), updateModule);
router.delete('/modules/:id', protect, authorize('teacher', 'admin'), deleteModule);

// Public - single course (wildcard - must be LAST among GET routes)
router.get('/:idOrSlug', getCourse);
router.get('/:courseId/modules', getModules);

// Create / Update / Delete
router.post('/', protect, authorize('teacher', 'admin'), createCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), updateCourse);
router.patch('/:id', protect, authorize('teacher', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('admin'), deleteCourse);

// Modules
router.post('/:courseId/modules', protect, authorize('teacher', 'admin'), addModule);

module.exports = router;

