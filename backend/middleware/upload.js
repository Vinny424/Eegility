// middleware/upload.js - File upload middleware
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store files in upload directory
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter to allow only supported EEG file types
const fileFilter = (req, file, cb) => {
  // Supported EEG file extensions
  const supportedExtensions = [
    '.edf', '.edf+', '.bdf',              // European Data Format / BioSemi
    '.vhdr', '.vmrk', '.eeg',             // BrainVision
    '.set',                               // EEGLAB
    '.fif',                               // FIF format
    '.cnt',                               // Neuroscan
    '.npy'                                // NumPy arrays
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (supportedExtensions.includes(ext)) {
    // Accept file
    cb(null, true);
  } else {
    // Reject file
    cb(new Error(`Unsupported file type: ${ext}. Supported types: ${supportedExtensions.join(', ')}`), false);
  }
};

// Create multer upload object with 100MB file size limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Middleware for single file upload
const uploadSingleEEG = upload.single('eegFile');

// Wrapper middleware to handle multer errors
const handleEEGUpload = (req, res, next) => {
  uploadSingleEEG(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer error (like file size exceeded)
      return res.status(400).json({
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      // Other error (like unsupported file type)
      return res.status(400).json({
        message: err.message
      });
    }
    
    // No error, proceed
    next();
  });
};

// Cleanup middleware to remove uploaded files on error
const cleanupOnError = (req, res, next) => {
  // Save the original end function
  const originalEnd = res.end;
  
  // Override the end function
  res.end = function (chunk, encoding) {
    // If there was an error and a file was uploaded, delete it
    if (res.statusCode >= 400 && req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error cleaning up file:', err);
      });
    }
    
    // Call the original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = {
  handleEEGUpload,
  cleanupOnError
};