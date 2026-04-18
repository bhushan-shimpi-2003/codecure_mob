const express = require('express');
const { signup, login, getMe, logout, updateMe, deleteMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.patch('/me', protect, updateMe);

router.delete('/me', protect, deleteMe);
router.post('/logout', protect, logout);

module.exports = router;
