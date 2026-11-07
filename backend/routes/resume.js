const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const authMiddleware = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - only allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET active resume metadata (public route)
// Excludes fileData to keep the response lightweight
router.get('/active', async (req, res) => {
  try {
    const resume = await Resume.findOne({ isActive: true })
      .sort({ uploadedAt: -1 })
      .select('-fileData');

    if (!resume) {
      return res.status(404).json({ message: 'No active resume found' });
    }

    res.json(resume);
  } catch (error) {
    console.error('Error fetching active resume:', error);
    res.status(500).json({ message: 'Error fetching resume' });
  }
});

// GET all resumes (protected route)
// Excludes fileData to keep the response lightweight
router.get('/', authMiddleware, async (req, res) => {
  try {
    const resumes = await Resume.find()
      .sort({ uploadedAt: -1 })
      .select('-fileData');
    res.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ message: 'Error fetching resumes' });
  }
});

// UPLOAD new resume (protected route)
router.post('/', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    console.log('========================================');
    console.log('📄 NEW RESUME UPLOAD REQUEST');
    console.log('========================================');

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname);
    console.log('File size:', req.file.size, 'bytes');

    // Read file into a Buffer so it persists in MongoDB
    const fileData = fs.readFileSync(req.file.path);

    // Deactivate all previous resumes
    await Resume.updateMany({}, { isActive: false });
    console.log('✅ Previous resumes deactivated');

    const resume = new Resume({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileData: fileData,
      isActive: true
    });

    const savedResume = await resume.save();
    console.log('✅ Resume saved successfully (file stored in MongoDB)!');
    console.log('Resume ID:', savedResume._id);
    console.log('========================================\n');

    // Return response without the binary data
    const responseObj = savedResume.toObject();
    delete responseObj.fileData;
    res.status(201).json(responseObj);
  } catch (error) {
    console.error('========================================');
    console.error('❌ ERROR UPLOADING RESUME');
    console.error('========================================');
    console.error('Error:', error);
    console.error('========================================\n');

    // Clean up uploaded file if database save failed
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: 'Error uploading resume',
      error: error.message
    });
  }
});

// SET active resume (protected route)
router.patch('/:id/activate', authMiddleware, async (req, res) => {
  try {
    console.log('Setting resume as active:', req.params.id);

    // Deactivate all resumes
    await Resume.updateMany({}, { isActive: false });

    // Activate the selected one
    const resume = await Resume.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-fileData');

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    console.log('✅ Resume activated:', resume.originalName);
    res.json(resume);
  } catch (error) {
    console.error('Error activating resume:', error);
    res.status(500).json({ message: 'Error activating resume' });
  }
});

// DELETE resume (protected route)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Deleting resume:', req.params.id);

    const resume = await Resume.findById(req.params.id).select('-fileData');

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Delete file from filesystem (if it still exists)
    if (resume.filePath && fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
      console.log('✅ File deleted from filesystem');
    }

    // Delete from database
    await Resume.findByIdAndDelete(req.params.id);
    console.log('✅ Resume deleted from database');

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ message: 'Error deleting resume' });
  }
});

// DOWNLOAD active resume directly (public route — no ID needed)
// Serves the file from MongoDB binary data (survives Render restarts)
router.get('/download/active', async (req, res) => {
  try {
    const resume = await Resume.findOne({ isActive: true }).sort({ uploadedAt: -1 });

    if (!resume) {
      return res.status(404).json({ message: 'No active resume found' });
    }

    // Serve from MongoDB binary data
    if (resume.fileData && resume.fileData.length > 0) {
      res.set({
        'Content-Type': resume.mimeType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${resume.originalName}"`,
        'Content-Length': resume.fileData.length
      });
      return res.send(resume.fileData);
    }

    // Fallback: try filesystem (for old uploads before this change)
    if (resume.filePath && fs.existsSync(resume.filePath)) {
      return res.download(resume.filePath, resume.originalName);
    }

    return res.status(404).json({ message: 'Resume file not found on server' });
  } catch (error) {
    console.error('Error downloading active resume:', error);
    res.status(500).json({ message: 'Error downloading resume' });
  }
});

// DOWNLOAD resume by ID (public route)
router.get('/download/:id', async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Serve from MongoDB binary data
    if (resume.fileData && resume.fileData.length > 0) {
      res.set({
        'Content-Type': resume.mimeType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${resume.originalName}"`,
        'Content-Length': resume.fileData.length
      });
      return res.send(resume.fileData);
    }

    // Fallback: try filesystem
    if (resume.filePath && fs.existsSync(resume.filePath)) {
      return res.download(resume.filePath, resume.originalName);
    }

    return res.status(404).json({ message: 'File not found' });
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ message: 'Error downloading resume' });
  }
});

module.exports = router;
