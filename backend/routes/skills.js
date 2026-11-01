'use strict';

const express        = require('express');
const router         = express.Router();
const Skill          = require('../models/Skill');
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
    const skills = await Skill.find().sort({ category: 1, order: 1 });
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ message: 'Error fetching skills' });
  }
});

// ─── Protected ────────────────────────────────────────────────────

// POST — create skill
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, category, level, icon, order } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required' });
    }

    const skill = new Skill({
      name,
      category,
      level: level || 'Intermediate',
      icon,
      order: order || 0
    });

    await skill.save();

    const syncResult = await ragSync.syncAfterCreate('skill').catch(e => ({
      success: false, error: e.message
    }));

    res.status(201).json({ ...skill.toObject(), ragSync: _syncSummary(syncResult) });
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ message: 'Error creating skill' });
  }
});

// PUT — update skill
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, category, level, icon, order } = req.body;

    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    if (name     !== undefined) skill.name     = name;
    if (category !== undefined) skill.category = category;
    if (level    !== undefined) skill.level    = level;
    if (icon     !== undefined) skill.icon     = icon;
    if (order    !== undefined) skill.order    = order;

    await skill.save();

    const syncResult = await ragSync.syncAfterUpdate('skill').catch(e => ({
      success: false, error: e.message
    }));

    res.json({ ...skill.toObject(), ragSync: _syncSummary(syncResult) });
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ message: 'Error updating skill' });
  }
});

// DELETE — delete skill
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    const syncResult = await ragSync.syncAfterDelete('skill').catch(e => ({
      success: false, error: e.message
    }));

    res.json({ message: 'Skill deleted successfully', ragSync: _syncSummary(syncResult) });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ message: 'Error deleting skill' });
  }
});

module.exports = router;
