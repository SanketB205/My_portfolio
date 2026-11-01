'use strict';

const express        = require('express');
const router         = express.Router();
const multer         = require('multer');
const path           = require('path');
const fs             = require('fs');
const Project        = require('../models/Project');
const authMiddleware = require('../middleware/auth');
const ragSync        = require('../services/portfolioRagSyncService');

// ─── Multer — thumbnail uploads ───────────────────────────────────
const thumbnailDir = path.join(__dirname, '../uploads/thumbnails');
if (!fs.existsSync(thumbnailDir)) fs.mkdirSync(thumbnailDir, { recursive: true });

const thumbnailStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, thumbnailDir),
  filename:    (_req,  file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'thumb-' + unique + path.extname(file.originalname));
  }
});

const thumbnailUpload = multer({
  storage:    thumbnailStorage,
  limits:     { fileSize: 5 * 1024 * 1024 },   // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/i;
    const ok = allowed.test(path.extname(file.originalname)) &&
               allowed.test(file.mimetype.split('/')[1]);
    ok ? cb(null, true) : cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
  }
});

// ─── Public ───────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ featured: -1, order: 1, createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// ─── Protected — Reorder & CRUD ───────────────────────────────────

// PUT /api/projects/reorder — batch reorder projects
router.put('/reorder', authMiddleware, async (req, res) => {
  try {
    const { orderList } = req.body;
    if (!Array.isArray(orderList)) {
      return res.status(400).json({ message: 'orderList must be an array of project IDs or { id, order } objects' });
    }

    const bulkOps = orderList.map((item, index) => {
      const id = typeof item === 'object' && item !== null ? item.id || item._id : item;
      const order = typeof item === 'object' && item !== null && typeof item.order === 'number' ? item.order : index;
      return {
        updateOne: {
          filter: { _id: id },
          update: { $set: { order: order } }
        }
      };
    });

    if (bulkOps.length > 0) {
      await Project.bulkWrite(bulkOps);
    }

    const projects = await Project.find().sort({ featured: -1, order: 1, createdAt: -1 });
    res.json({ message: 'Projects reordered successfully', projects });
  } catch (error) {
    console.error('Error reordering projects:', error);
    res.status(500).json({ message: 'Error reordering projects', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Error fetching project' });
  }
});

// POST — create project
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('========================================');
    console.log('📝 NEW PROJECT CREATION REQUEST');
    console.log('========================================');

    const { title, description, techStack, githubLink, liveDemoLink, year, featured, order } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    // Determine default order if not provided
    let assignedOrder = 0;
    if (order !== undefined && order !== null && order !== '') {
      assignedOrder = Number(order);
    } else {
      const maxOrderProject = await Project.findOne().sort({ order: -1 });
      assignedOrder = maxOrderProject && typeof maxOrderProject.order === 'number' ? maxOrderProject.order + 1 : 0;
    }

    const project = new Project({
      title,
      description,
      techStack:    techStack    || [],
      githubLink:   githubLink   || '',
      liveDemoLink: liveDemoLink || '',
      year:         year         || new Date().getFullYear(),
      featured:     featured     || false,
      order:        assignedOrder,
      thumbnail:    null
    });

    const saved = await project.save();
    console.log('✅ Project saved  id:', saved._id);

    // Respond immediately — RAG sync runs in the background (non-blocking)
    res.status(201).json({ ...saved.toObject(), ragSync: { queued: true } });

    ragSync.syncAfterCreate('project').catch(e =>
      console.error('[RAG Sync] Background sync failed after create:', e.message)
    );
  } catch (error) {
    console.error('❌ ERROR CREATING PROJECT:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message, details: error.errors });
    }
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

// PUT — update project fields (NOT thumbnail — use the dedicated route below)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, techStack, githubLink, liveDemoLink, year, featured, order } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (title        !== undefined) project.title        = title;
    if (description  !== undefined) project.description  = description;
    if (techStack    !== undefined) project.techStack    = techStack;
    if (githubLink   !== undefined) project.githubLink   = githubLink;
    if (liveDemoLink !== undefined) project.liveDemoLink = liveDemoLink;
    if (year         !== undefined) project.year         = year;
    if (featured     !== undefined) project.featured     = featured;
    if (order        !== undefined && order !== null && order !== '') project.order = Number(order);

    project.updatedAt = Date.now();
    await project.save();

    // Respond immediately — RAG sync runs in the background (non-blocking)
    res.json({ ...project.toObject(), ragSync: { queued: true } });

    ragSync.syncAfterUpdate('project').catch(e =>
      console.error('[RAG Sync] Background sync failed after update:', e.message)
    );
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Error updating project' });
  }
});

// DELETE — delete project (also remove thumbnail file if present)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Clean up thumbnail file from disk
    if (project.thumbnail) {
      const filePath = path.join(__dirname, '..', project.thumbnail.replace(/^\//, ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Respond immediately — RAG sync runs in the background (non-blocking)
    res.json({ message: 'Project deleted successfully', ragSync: { queued: true } });

    ragSync.syncAfterDelete('project').catch(e =>
      console.error('[RAG Sync] Background sync failed after delete:', e.message)
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project' });
  }
});

// ─── Protected — Thumbnail ────────────────────────────────────────

/**
 * POST /api/projects/:id/thumbnail
 * Upload or replace a thumbnail for a project.
 * Accepts: multipart/form-data  field name: "thumbnail"
 */
router.post('/:id/thumbnail', authMiddleware, (req, res, next) => {
  thumbnailUpload.single('thumbnail')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image must be smaller than 5 MB' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file uploaded' });

    const project = await Project.findById(req.params.id);
    if (!project) {
      // Clean up uploaded file if project not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete the previous thumbnail file if one existed
    if (project.thumbnail) {
      const old = path.join(__dirname, '..', project.thumbnail.replace(/^\//, ''));
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }

    // Store as a URL path relative to the server root
    project.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    await project.save();

    res.json({ thumbnail: project.thumbnail, message: 'Thumbnail uploaded successfully' });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    // Clean up file if DB save failed
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Error uploading thumbnail' });
  }
});

/**
 * DELETE /api/projects/:id/thumbnail
 * Remove the thumbnail from a project and delete the file.
 */
router.delete('/:id/thumbnail', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.thumbnail) {
      const filePath = path.join(__dirname, '..', project.thumbnail.replace(/^\//, ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      project.thumbnail = null;
      await project.save();
    }

    res.json({ message: 'Thumbnail removed successfully' });
  } catch (error) {
    console.error('Error removing thumbnail:', error);
    res.status(500).json({ message: 'Error removing thumbnail' });
  }
});

// ─── Helper ───────────────────────────────────────────────────────

function _syncSummary(result) {
  if (!result) return { success: false };
  if (result.error) return { success: false, error: result.error };
  return {
    success:        result.failed === 0,
    indexed:        result.indexed        ?? 0,
    totalDocuments: result.totalDocuments ?? 0,
    failed:         result.failed         ?? 0
  };
}

module.exports = router;
