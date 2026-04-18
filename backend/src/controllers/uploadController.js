const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create 'public/uploads' dynamically if it doesn't exist
    const dir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `img_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
}).single('image');

exports.uploadImage = (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    // Return relative path so it can be prefixed by frontend if running on same server, or full absolute URL
    // Handle base URL for uploads
    let baseUrl = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL;
    
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    
    if (!baseUrl) {
      baseUrl = `http://localhost:${process.env.PORT || 5000}`;
    }

    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, url: fileUrl });
  });
};
