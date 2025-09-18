const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();

// --- Multer Configuration ---

// 1. Define storage settings
const storage = multer.diskStorage({
  // Set the destination folder where files will be saved
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  // Set the filename to be unique to avoid conflicts
  filename: (req, file, cb) => {
    // Create a unique filename: fieldname-timestamp.extension
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}`);
  },
});

// 2. Define file filter to accept only images
const fileFilter = (req, file, cb) => {
  // Regular expression to check for image file extensions
  const allowedFileTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedFileTypes.test(file.mimetype);
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images are allowed!'));
};

// 3. Initialize multer with the storage and filter settings
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
});

// --- API Endpoint Definition ---

// @route   POST /api/upload
// @desc    Upload a single file
// @access  Public
// The 'upload.single("profileImage")' middleware processes the file upload.
// "profileImage" must match the name of the form field on the frontend.
router.post('/', upload.single('profileImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  
  // If upload is successful, multer adds a 'file' object to the request.
  // We send back the public URL of the uploaded file.
  // Note: Replace backslashes with forward slashes for URL compatibility.
  const filePath = `/${req.file.path.replace(/\\/g, "/")}`;
  res.status(200).json({
    message: 'Image uploaded successfully',
    filePath: filePath, // e.g., /uploads/profileImage-1678886400000.png
  });
});

module.exports = router;
