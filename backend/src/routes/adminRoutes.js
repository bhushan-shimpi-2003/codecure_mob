const express = require('express');
const {
  getStudents, getStaff, updateUserRole, deleteUser,
  getTransactions, createTransaction, updateTransaction, deleteTransaction,
  getFeedback, resolveComplaint,
  getSettings, updateSetting,
} = require('../controllers/adminController');
const { createStaff } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// All admin routes require admin role
router.use(protect, authorize('admin'));

// Students & Staff
router.get('/students', getStudents);
router.get('/staff', getStaff);
router.post('/staff', createStaff);
router.put('/users/:id/role', updateUserRole);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Finance
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.put('/transactions/:id', updateTransaction);
router.patch('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

// Feedback
router.get('/feedback', getFeedback);
router.put('/feedback/:id/resolve', resolveComplaint);
router.patch('/feedback/:id/resolve', resolveComplaint);

// Settings
router.get('/settings', getSettings);
router.put('/settings/:key', updateSetting);
router.patch('/settings/:key', updateSetting);

module.exports = router;
