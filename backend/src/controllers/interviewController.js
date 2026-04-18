const InterviewModel = require('../models/MockInterview');

// @desc    Schedule a mock interview (teacher)
// @route   POST /api/interviews
// @access  Private (teacher, admin)
exports.scheduleInterview = async (req, res, next) => {
  try {
    const { course_id, title, meeting_link, ...interviewData } = req.body;
    const interview = await InterviewModel.scheduleInterview({
      ...interviewData,
      meet_link: meeting_link,
      teacher_id: req.user.id,
    });
    res.status(201).json({ success: true, data: interview });
  } catch (err) {
    next(err);
  }
};

// @desc    Update an interview (teacher)
// @route   PUT /api/interviews/:id
// @access  Private (teacher, admin)
exports.updateInterview = async (req, res, next) => {
  try {
    const interview = await InterviewModel.updateInterview(req.params.id, req.body);
    res.status(200).json({ success: true, data: interview });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete an interview (teacher)
// @route   DELETE /api/interviews/:id
// @access  Private (teacher, admin)
exports.deleteInterview = async (req, res, next) => {
  try {
    await InterviewModel.deleteInterview(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Get my interviews (student)
// @route   GET /api/interviews/me
// @access  Private (student)
exports.getMyInterviews = async (req, res, next) => {
  try {
    const interviews = await InterviewModel.getInterviewsByStudent(req.user.id);
    res.status(200).json({ success: true, data: interviews });
  } catch (err) {
    next(err);
  }
};

// @desc    Get interviews I conduct (teacher)
// @route   GET /api/interviews/teacher
// @access  Private (teacher)
exports.getTeacherInterviews = async (req, res, next) => {
  try {
    const interviews = await InterviewModel.getInterviewsByTeacher(req.user.id);
    res.status(200).json({ success: true, data: interviews });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all interviews (admin)
// @route   GET /api/interviews
// @access  Private (admin)
exports.getAllInterviews = async (req, res, next) => {
  try {
    const interviews = await InterviewModel.getAllInterviews();
    res.status(200).json({ success: true, count: interviews.length, data: interviews });
  } catch (err) {
    next(err);
  }
};

// @desc    Complete an interview with score (teacher)
// @route   PUT /api/interviews/:id/complete
// @access  Private (teacher, admin)
exports.completeInterview = async (req, res, next) => {
  try {
    const { score, notes } = req.body;
    const interview = await InterviewModel.completeInterview(req.params.id, score, notes);
    res.status(200).json({ success: true, data: interview });
  } catch (err) {
    next(err);
  }
};
