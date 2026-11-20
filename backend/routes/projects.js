'use strict';

const express        = require('express');
const router         = express.Router();
const multer         = require('multer');
const Project        = require('../models/Project');
const authMiddleware = require('../middleware/auth');
const ragSync        = require('../services/portfolioRagSyncService');
const cloudinary     = require('../utils/cloudinary');

// ─── Multer — memory storage (no disk writes on Render) ───────────
const thumbnailUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },   // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|webp)$/i;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
    }
  }
});

// ─── Helper: upload buffer to Cloudinary via upload_stream ────────
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:          'portfolio/projects',
        resource_type:   'image',
        transformation:  [{ quality: 'auto', fetch_format: 'auto' }],
        ...options
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// ─── Helper: safely delete a Cloudinary image by public_id ────────
async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log('☁️  Cloudinary image deleted:', publicId);
  } catch (err) {
    // Non-fatal — log but don't throw
    console.error('⚠  Failed to delete Cloudinary image:', publicId, err.message);
  }
}

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
      thumbnail:    null,
      thumbnailPublicId: null
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

// DELETE — delete project (also clean up Cloudinary thumbnail)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Clean up Cloudinary thumbnail
    if (project.thumbnailPublicId) {
      deleteFromCloudinary(project.thumbnailPublicId);
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

// ─── Protected — Thumbnail (Cloudinary) ───────────────────────────

/**
 * POST /api/projects/:id/thumbnail
 * Upload or replace a thumbnail for a project.
 * Accepts: multipart/form-data  field name: "thumbnail"
 *
 * Safe replacement strategy:
 *   1. Upload new image to Cloudinary first
 *   2. Update MongoDB with new URL/publicId
 *   3. Delete old Cloudinary image only after DB update succeeds
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
      return res.status(404).json({ message: 'Project not found' });
    }

    // Remember old public ID for cleanup after successful update
    const oldPublicId = project.thumbnailPublicId || null;

    // 1. Upload to Cloudinary
    console.log(`☁️  Uploading thumbnail for project "${project.title}" to Cloudinary...`);
    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `project-${project._id}-${Date.now()}`
    });
    console.log('☁️  Cloudinary upload success:', result.public_id);

    // 2. Update MongoDB with Cloudinary URL
    project.thumbnail         = result.secure_url;
    project.thumbnailPublicId = result.public_id;
    await project.save();
    console.log('✅ Project thumbnail updated in MongoDB');

    // 3. Delete old image from Cloudinary (only after DB update succeeded)
    if (oldPublicId && oldPublicId !== result.public_id) {
      deleteFromCloudinary(oldPublicId);
    }

    res.json({
      thumbnail:         project.thumbnail,
      thumbnailPublicId: project.thumbnailPublicId,
      message:           'Thumbnail uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ message: 'Error uploading thumbnail', error: error.message });
  }
});

/**
 * DELETE /api/projects/:id/thumbnail
 * Remove the thumbnail from a project and delete from Cloudinary.
 */
router.delete('/:id/thumbnail', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const publicIdToDelete = project.thumbnailPublicId;

    if (project.thumbnail) {
      project.thumbnail         = null;
      project.thumbnailPublicId = null;
      await project.save();
    }

    // Delete from Cloudinary after DB update
    if (publicIdToDelete) {
      deleteFromCloudinary(publicIdToDelete);
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
