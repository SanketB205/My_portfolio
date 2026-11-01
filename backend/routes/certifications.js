'use strict';

const express        = require('express');
const router         = express.Router();
const Certification  = require('../models/Certification');
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
    const certs = await Certification.find().sort({ order: 1, createdAt: 1 });
    res.json(certs);
  } catch (err) {
    console.error('Error fetching certifications:', err);
    res.status(500).json({ message: 'Error fetching certifications' });
  }
});

// ─── Protected ────────────────────────────────────────────────────

// POST — create certification
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, issuer, year, order } = req.body;

    if (!title || !issuer || !year) {
      return res.status(400).json({ message: 'Title, issuer, and year are required' });
    }

    const cert  = new Certification({ title, issuer, year, order: order || 0 });
    const saved = await cert.save();

    const syncResult = await ragSync.syncAfterCreate('certification').catch(e => ({
      success: false, error: e.message
    }));

    res.status(201).json({ ...saved.toObject(), ragSync: _syncSummary(syncResult) });
  } catch (err) {
    console.error('Error creating certification:', err);
    res.status(500).json({ message: 'Error creating certification', error: err.message });
  }
});

// PUT — update certification
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, issuer, year, order } = req.body;

    const cert = await Certification.findById(req.params.id);
    if (!cert) return res.status(404).json({ message: 'Certification not found' });

    if (title  !== undefined) cert.title  = title;
    if (issuer !== undefined) cert.issuer = issuer;
    if (year   !== undefined) cert.year   = year;
    if (order  !== undefined) cert.order  = order;

    const updated = await cert.save();

    const syncResult = await ragSync.syncAfterUpdate('certification').catch(e => ({
      success: false, error: e.message
    }));

    res.json({ ...updated.toObject(), ragSync: _syncSummary(syncResult) });
  } catch (err) {
    console.error('Error updating certification:', err);
    res.status(500).json({ message: 'Error updating certification', error: err.message });
  }
});

// DELETE — delete certification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const cert = await Certification.findByIdAndDelete(req.params.id);
    if (!cert) return res.status(404).json({ message: 'Certification not found' });

    const syncResult = await ragSync.syncAfterDelete('certification').catch(e => ({
      success: false, error: e.message
    }));

    res.json({ message: 'Certification deleted successfully', ragSync: _syncSummary(syncResult) });
  } catch (err) {
    console.error('Error deleting certification:', err);
    res.status(500).json({ message: 'Error deleting certification' });
  }
});

module.exports = router;
