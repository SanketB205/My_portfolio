'use strict';

const express        = require('express');
const router         = express.Router();
const Experience     = require('../models/Experience');
const authMiddleware = require('../middleware/auth');
const ragSync        = require('../services/portfolioRagSyncService');

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

// ─── Public ───────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const experiences = await Experience.find().sort({ startDate: -1, order: 1 });
    res.json(experiences);
  } catch (error) {
    console.error('Error fetching experiences:', error);
    res.status(500).json({ message: 'Error fetching experiences' });
  }
});

// ─── Protected ────────────────────────────────────────────────────

// POST — create experience
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      company, position, startDate, endDate, current,
      description, responsibilities, technologies, location, order
    } = req.body;

    if (!company || !position || !startDate || !description) {
      return res.status(400).json({
        message: 'Company, position, start date, and description are required'
      });
    }

    const experience = new Experience({
      company,
      position,
      startDate,
      endDate:          current ? null : endDate,
      current:          current || false,
      description,
      responsibilities: responsibilities || [],
      technologies:     technologies     || [],
      location,
      order:            order || 0
    });

    await experience.save();

    const syncResult = await ragSync.syncAfterCreate('experience').catch(e => ({
      success: false, error: e.message
    }));

    res.status(201).json({ ...experience.toObject(), ragSync: _syncSummary(syncResult) });
  } catch (error) {
    console.error('Error creating experience:', error);
    res.status(500).json({ message: 'Error creating experience' });
  }
});

// PUT — update experience
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      company, position, startDate, endDate, current,
      description, responsibilities, technologies, location, order
    } = req.body;

    const experience = await Experience.findById(req.params.id);
    if (!experience) return res.status(404).json({ message: 'Experience not found' });

    if (company          !== undefined) experience.company          = company;
    if (position         !== undefined) experience.position         = position;
    if (startDate        !== undefined) experience.startDate        = startDate;
    if (endDate          !== undefined) experience.endDate          = endDate;
    if (current          !== undefined) {
      experience.current = current;
      if (current) experience.endDate = null;
    }
    if (description      !== undefined) experience.description      = description;
    if (responsibilities !== undefined) experience.responsibilities = responsibilities;
    if (technologies     !== undefined) experience.technologies     = technologies;
    if (location         !== undefined) experience.location         = location;
    if (order            !== undefined) experience.order            = order;

    await experience.save();

    const syncResult = await ragSync.syncAfterUpdate('experience').catch(e => ({
      success: false, error: e.message
    }));

    res.json({ ...experience.toObject(), ragSync: _syncSummary(syncResult) });
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({ message: 'Error updating experience' });
  }
});

// DELETE — delete experience
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const experience = await Experience.findByIdAndDelete(req.params.id);
    if (!experience) return res.status(404).json({ message: 'Experience not found' });

    const syncResult = await ragSync.syncAfterDelete('experience').catch(e => ({
      success: false, error: e.message
    }));

    res.json({ message: 'Experience deleted successfully', ragSync: _syncSummary(syncResult) });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({ message: 'Error deleting experience' });
  }
});

module.exports = router;
