const DoubtModel = require('../models/Doubt');

// @desc    Create a doubt (student)
// @route   POST /api/doubts
// @access  Private (student)
exports.createDoubt = async (req, res, next) => {
  try {
    const doubt = await DoubtModel.createDoubt({ ...req.body, student_id: req.user.id });
    res.status(201).json({ success: true, data: doubt });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a doubt (student)
// @route   PUT /api/doubts/:id
// @access  Private (student, admin)
exports.updateDoubt = async (req, res, next) => {
  try {
    const doubt = await DoubtModel.updateDoubt(req.params.id, req.body);
    res.status(200).json({ success: true, data: doubt });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a doubt (student)
// @route   DELETE /api/doubts/:id
// @access  Private (student, admin)
exports.deleteDoubt = async (req, res, next) => {
  try {
    await DoubtModel.deleteDoubt(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Get my doubts (student)
// @route   GET /api/doubts/me
// @access  Private (student)
exports.getMyDoubts = async (req, res, next) => {
  try {
    const doubts = await DoubtModel.getDoubtsByStudent(req.user.id);
    res.status(200).json({ success: true, data: doubts });
  } catch (err) {
    next(err);
  }
};

// @desc    Get doubts assigned to me (teacher)
// @route   GET /api/doubts/teacher
// @access  Private (teacher)
exports.getTeacherDoubts = async (req, res, next) => {
  try {
    const doubts = await DoubtModel.getDoubtsByTeacher(req.user.id);
    res.status(200).json({ success: true, data: doubts });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all doubts (admin)
// @route   GET /api/doubts
// @access  Private (admin)
exports.getAllDoubts = async (req, res, next) => {
  try {
    const doubts = await DoubtModel.getAllDoubts();
    res.status(200).json({ success: true, count: doubts.length, data: doubts });
  } catch (err) {
    next(err);
  }
};

// @desc    Resolve a doubt (teacher reply)
// @route   PUT /api/doubts/:id/resolve
// @access  Private (teacher, admin)
exports.resolveDoubt = async (req, res, next) => {
  try {
    const { reply } = req.body;
    const doubt = await DoubtModel.resolveDoubt(req.params.id, reply, req.user.id);
    res.status(200).json({ success: true, data: doubt });
  } catch (err) {
    next(err);
  }
};
