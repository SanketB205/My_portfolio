'use strict';

const express    = require('express');
const router     = express.Router();
const vectorStore = require('../services/chromaService'); // vectra-backed
const auth       = require('../middleware/auth');

/**
 * GET /api/vectordb/health
 * Quick health check.
 */
router.get('/health', (req, res) => {
  const ready = vectorStore.isReady();
  res.json({
    success: ready,
    message: ready ? 'Vector store is ready' : 'Vector store is not initialized',
    ready
  });
});

/**
 * GET /api/vectordb/status
 * Detailed stats (document count, path, backend).
 */
router.get('/status', async (req, res) => {
  try {
    const stats = await vectorStore.getStats();
    res.json({ success: true, ...stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/vectordb/reindex  (admin only)
 * Re-runs the full portfolio indexing pipeline inside the running server process.
 * This updates the in-memory Vectra instance so the chatbot sees new documents
 * immediately without restarting the server.
 */
router.post('/reindex', auth, async (req, res) => {
  try {
    const { indexPortfolioDocuments } = require('../services/portfolioIndexer');
    const stats = await indexPortfolioDocuments();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
