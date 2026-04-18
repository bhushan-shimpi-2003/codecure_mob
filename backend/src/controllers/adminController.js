const UserModel = require('../models/User');
const TransactionModel = require('../models/Transaction');
const FeedbackModel = require('../models/Feedback');
const SettingsModel = require('../models/PlatformSettings');

// --- Student / Staff Management ---

// @desc    Get all students (admin)
// @route   GET /api/admin/students
// @access  Private (admin)
exports.getStudents = async (req, res, next) => {
  try {
    const students = await UserModel.getStudents();
    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all teachers/staff (admin)
// @route   GET /api/admin/staff
// @access  Private (admin)
exports.getStaff = async (req, res, next) => {
  try {
    const staff = await UserModel.getTeachers();
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user role (admin)
// @route   PUT /api/admin/users/:id/role
// @access  Private (admin)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await UserModel.updateUserRole(req.params.id, role);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete from Supabase Auth (this will cascade to public.profiles and other related tables)
    const { error } = await UserModel.deleteUserCompletely(id);
    
    if (error) throw error;

    res.status(200).json({ success: true, message: 'User deleted successfully', data: {} });
  } catch (err) {
    next(err);
  }
};

// --- Finance ---

// @desc    Get all transactions (admin)
// @route   GET /api/admin/transactions
// @access  Private (admin)
exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await TransactionModel.getAllTransactions();
    res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a transaction
// @route   POST /api/admin/transactions
// @access  Private (admin)
exports.createTransaction = async (req, res, next) => {
  try {
    const txn = await TransactionModel.createTransaction(req.body);
    res.status(201).json({ success: true, data: txn });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a transaction (admin)
// @route   PUT /api/admin/transactions/:id
// @access  Private (admin)
exports.updateTransaction = async (req, res, next) => {
  try {
    const txn = await TransactionModel.updateTransaction(req.params.id, req.body);
    res.status(200).json({ success: true, data: txn });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a transaction (admin)
// @route   DELETE /api/admin/transactions/:id
// @access  Private (admin)
exports.deleteTransaction = async (req, res, next) => {
  try {
    await TransactionModel.deleteTransaction(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
  

// --- Feedback ---

// @desc    Get all feedback (admin)
// @route   GET /api/admin/feedback
// @access  Private (admin)
exports.getFeedback = async (req, res, next) => {
  try {
    const feedback = await FeedbackModel.getAllFeedback();
    res.status(200).json({ success: true, count: feedback.length, data: feedback });
  } catch (err) {
    next(err);
  }
};

// @desc    Resolve a complaint (admin)
// @route   PUT /api/admin/feedback/:id/resolve
// @access  Private (admin)
exports.resolveComplaint = async (req, res, next) => {
  try {
    const fb = await FeedbackModel.resolveComplaint(req.params.id);
    res.status(200).json({ success: true, data: fb });
  } catch (err) {
    next(err);
  }
};

// --- Platform Settings ---

// @desc    Get all platform settings (admin)
// @route   GET /api/admin/settings
// @access  Private (admin)
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await SettingsModel.getAllSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a platform setting (admin)
// @route   PUT /api/admin/settings/:key
// @access  Private (admin)
exports.updateSetting = async (req, res, next) => {
  try {
    const { value } = req.body;
    const setting = await SettingsModel.updateSetting(req.params.key, value);
    res.status(200).json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
};
