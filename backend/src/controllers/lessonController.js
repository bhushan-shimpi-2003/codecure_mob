const LessonModel = require('../models/Lesson');

// @desc    Get lessons for a course
// @route   GET /api/lessons/course/:courseId
// @access  Private (enrolled students, teacher, admin)
exports.getLessons = async (req, res, next) => {
  try {
    const lessons = await LessonModel.getLessonsByCourse(req.params.courseId);
    res.status(200).json({ success: true, count: lessons.length, data: lessons });
  } catch (err) {
    next(err);
  }
};

// @desc    Get latest lesson for a course (for student dashboard)
// @route   GET /api/lessons/course/:courseId/latest
// @access  Private
exports.getLatestLesson = async (req, res, next) => {
  try {
    const lesson = await LessonModel.getLatestLessonByCourse(req.params.courseId);
    res.status(200).json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
};

// @desc    Create/publish a lesson (teacher publish flow)
// @route   POST /api/lessons
// @access  Private (teacher, admin)
exports.createLesson = async (req, res, next) => {
  try {
    const lesson = await LessonModel.createLesson(req.body);
    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a lesson
// @route   PUT /api/lessons/:id
// @access  Private (teacher, admin)
exports.updateLesson = async (req, res, next) => {
  try {
    const lesson = await LessonModel.updateLesson(req.params.id, req.body);
    res.status(200).json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a lesson
// @route   DELETE /api/lessons/:id
// @access  Private (teacher, admin)
exports.deleteLesson = async (req, res, next) => {
  try {
    await LessonModel.deleteLesson(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
