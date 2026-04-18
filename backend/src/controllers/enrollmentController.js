const EnrollmentModel = require('../models/Enrollment');

// @desc    Request enrollment in a course (student)
// @route   POST /api/enrollments/request
// @access  Private (student)
exports.requestEnrollment = async (req, res, next) => {
  try {
    const { course_id } = req.body;
    const request = await EnrollmentModel.createEnrollmentRequest({
      student_id: req.user.id,
      course_id,
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};

// @desc    Get my enrollment requests (student)
// @route   GET /api/enrollments/requests/me
// @access  Private (student)
exports.getMyRequests = async (req, res, next) => {
  try {
    const requests = await EnrollmentModel.getRequestsByStudent(req.user.id);
    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all pending requests (admin)
// @route   GET /api/enrollments/requests/pending
// @access  Private (admin)
exports.getPendingRequests = async (req, res, next) => {
  try {
    const requests = await EnrollmentModel.getPendingRequests();
    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve/reject enrollment request (admin)
// @route   PUT /api/enrollments/requests/:id
// @access  Private (admin)
exports.resolveRequest = async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const updated = await EnrollmentModel.updateEnrollmentRequest(req.params.id, {
      status,
      resolved_by: req.user.id,
    });

    // If approved, create an actual enrollment
    if (status === 'approved') {
      await EnrollmentModel.createEnrollment({
        student_id: updated.student_id,
        course_id: updated.course_id,
        student_status: 'active',
        payment_status: 'completed',
        amount_paid: 0,
      });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// @desc    Get my enrollments (student)
// @route   GET /api/enrollments/me
// @access  Private (student)
exports.getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await EnrollmentModel.getEnrollmentsByStudent(req.user.id);
    res.status(200).json({ success: true, data: enrollments });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all enrollments (admin)
// @route   GET /api/enrollments
// @access  Private (admin)
exports.getAllEnrollments = async (req, res, next) => {
  try {
    const enrollments = await EnrollmentModel.getAllEnrollments();
    res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
  } catch (err) {
    next(err);
  }
};

// @desc    Update enrollment (progress, status)
// @route   PUT /api/enrollments/:id
// @access  Private (admin)
exports.updateEnrollment = async (req, res, next) => {
  try {
    const updated = await EnrollmentModel.updateEnrollment(req.params.id, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private (admin)
exports.deleteEnrollment = async (req, res, next) => {
  try {
    await EnrollmentModel.deleteEnrollment(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete enrollment request
// @route   DELETE /api/enrollments/requests/:id
// @access  Private (admin, student)
exports.deleteRequest = async (req, res, next) => {
  try {
    await EnrollmentModel.deleteEnrollmentRequest(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
