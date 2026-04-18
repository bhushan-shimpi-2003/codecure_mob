const ContactModel = require('../models/ContactMessage');
const FeedbackModel = require('../models/Feedback');
const JobModel = require('../models/JobOpening');

// --- Contact Messages ---

// @desc    Submit a contact message (public)
// @route   POST /api/contact
// @access  Public
exports.submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Please provide name, email, and message' });
    }
    const msg = await ContactModel.createContactMessage({ name, email, message });
    res.status(201).json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all contact messages (admin)
// @route   GET /api/contact
// @access  Private (admin)
exports.getContactMessages = async (req, res, next) => {
  try {
    const messages = await ContactModel.getAllContactMessages();
    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    next(err);
  }
};

// --- Feedback (student submit) ---

// @desc    Submit feedback (student)
// @route   POST /api/feedback
// @access  Private (student)
exports.submitFeedback = async (req, res, next) => {
  try {
    const fb = await FeedbackModel.createFeedback({ ...req.body, student_id: req.user.id });
    res.status(201).json({ success: true, data: fb });
  } catch (err) {
    next(err);
  }
};

// --- Job Openings ---

// @desc    Get active job openings (student career page)
// @route   GET /api/jobs
// @access  Private (student)
exports.getJobOpenings = async (req, res, next) => {
  try {
    const jobs = await JobModel.getActiveJobOpenings();
    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a job opening (admin)
// @route   POST /api/jobs
// @access  Private (admin)
exports.createJobOpening = async (req, res, next) => {
  try {
    const job = await JobModel.createJobOpening(req.body);
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a job opening
// @route   DELETE /api/jobs/:id
// @access  Private (admin/teacher)
exports.deleteJobOpening = async (req, res, next) => {
  try {
    await JobModel.deleteJobOpening(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
