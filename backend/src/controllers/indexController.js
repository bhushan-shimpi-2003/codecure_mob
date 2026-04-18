// @desc    Get index API message
// @route   GET /api/
// @access  Public
exports.getIndex = (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the CodeCure Academy API'
  });
};
