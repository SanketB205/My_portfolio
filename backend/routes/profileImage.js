const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ProfileImage = require('../models/ProfileImage');
const authMiddleware = require('../middleware/auth');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/profile');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config — images only, 5 MB cap
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ─── Public ──────────────────────────────────────────────────────────────────

// GET active profile image (used by Hero)
router.get('/active', async (req, res) => {
  try {
    const image = await ProfileImage.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!image) return res.status(404).json({ message: 'No active profile image' });
    res.json(image);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile image' });
  }
});

// ─── Protected ───────────────────────────────────────────────────────────────

// GET all profile images
router.get('/', authMiddleware, async (req, res) => {
  try {
    const images = await ProfileImage.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile images' });
  }
});

// POST upload new image
router.post('/', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Deactivate all previous images
    await ProfileImage.updateMany({}, { isActive: false });

    const image = new ProfileImage({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      isActive: true
    });

    const saved = await image.save();
    console.log('✅ Profile image uploaded:', saved.filename);
    res.status(201).json(saved);
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Error uploading profile image:', err);
    res.status(500).json({ message: 'Error uploading image', error: err.message });
  }
});

// PATCH set active
router.patch('/:id/activate', authMiddleware, async (req, res) => {
  try {
    await ProfileImage.updateMany({}, { isActive: false });
    const image = await ProfileImage.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!image) return res.status(404).json({ message: 'Image not found' });
    res.json(image);
  } catch (err) {
    res.status(500).json({ message: 'Error activating image' });
  }
});

// DELETE image
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const image = await ProfileImage.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });

    // Remove file from disk
    if (fs.existsSync(image.filePath)) fs.unlinkSync(image.filePath);

    await ProfileImage.findByIdAndDelete(req.params.id);
    console.log('✅ Profile image deleted:', image.filename);
    res.json({ message: 'Profile image deleted successfully' });
  } catch (err) {
    console.error('Error deleting profile image:', err);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

module.exports = router;
