const AssignmentModel = require('../models/Assignment');

// @desc    Create assignment (teacher)
// @route   POST /api/assignments
// @access  Private (teacher, admin)
exports.createAssignment = async (req, res, next) => {
  try {
    const data = { ...req.body, teacher_id: req.user.id };
    const assignment = await AssignmentModel.createAssignment(data);
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
};

// @desc    Update assignment (teacher)
// @route   PUT /api/assignments/:id
// @access  Private (teacher, admin)
exports.updateAssignment = async (req, res, next) => {
  try {
    const assignment = await AssignmentModel.updateAssignment(req.params.id, req.body);
    res.status(200).json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete assignment (teacher)
// @route   DELETE /api/assignments/:id
// @access  Private (teacher, admin)
exports.deleteAssignment = async (req, res, next) => {
  try {
    await AssignmentModel.deleteAssignment(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Get assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Private
exports.getAssignmentsByCourse = async (req, res, next) => {
  try {
    const assignments = await AssignmentModel.getAssignmentsByCourse(req.params.courseId);
    res.status(200).json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all assignments (admin log)
// @route   GET /api/assignments
// @access  Private (admin)
exports.getAllAssignments = async (req, res, next) => {
  try {
    const assignments = await AssignmentModel.getAllAssignments();
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit assignment (student)
// @route   POST /api/assignments/:id/submit
// @access  Private (student)
exports.submitAssignment = async (req, res, next) => {
  try {
    const submission = await AssignmentModel.submitAssignment({
      assignment_id: req.params.id,
      student_id: req.user.id,
      status: 'submitted',
      submission_url: req.body.submission_url,
    });
    res.status(201).json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
};

// @desc    Get my submissions (student)
// @route   GET /api/assignments/submissions/me
// @access  Private (student)
exports.getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await AssignmentModel.getSubmissionsByStudent(req.user.id);
    res.status(200).json({ success: true, data: submissions });
  } catch (err) {
    next(err);
  }
};

// @desc    Get assignments for all my enrolled courses (student)
// @route   GET /api/assignments/my-assignments
// @access  Private (student)
exports.getMyAssignments = async (req, res, next) => {
  try {
    const assignments = await AssignmentModel.getAssignmentsByStudentEnrollments(req.user.id);
    res.status(200).json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
};

// @desc    Get submissions by assignment ID (teacher)
// @route   GET /api/assignments/:id/submissions
// @access  Private (teacher, admin)
exports.getSubmissionsByAssignment = async (req, res, next) => {
  try {
    const submissions = await AssignmentModel.getSubmissionsByAssignment(req.params.id);
    res.status(200).json({ success: true, data: submissions });
  } catch (err) {
    next(err);
  }
};

// @desc    Grade a submission (teacher)
// @route   PUT /api/assignments/submissions/:id/grade
// @access  Private (teacher, admin)
exports.gradeSubmission = async (req, res, next) => {
  try {
    const { score, feedback } = req.body;
    const graded = await AssignmentModel.gradeSubmission(req.params.id, score, feedback);
    res.status(200).json({ success: true, data: graded });
  } catch (err) {
    next(err);
  }
};

// @desc    Update submission (student)
// @route   PUT /api/assignments/submissions/:id
// @access  Private (student, admin)
exports.updateSubmission = async (req, res, next) => {
  try {
    const submission = await AssignmentModel.updateSubmission(req.params.id, req.body);
    res.status(200).json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete submission (student)
// @route   DELETE /api/assignments/submissions/:id
// @access  Private (student, admin)
exports.deleteSubmission = async (req, res, next) => {
  try {
    await AssignmentModel.deleteSubmission(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
