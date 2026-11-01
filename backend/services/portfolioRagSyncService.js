'use strict';

/**
 * Portfolio RAG Sync Service
 *
 * Automatically synchronises the Vectra vector store whenever portfolio
 * data changes in MongoDB.  Called from CRUD route handlers immediately
 * after a successful save/delete — before the HTTP response is sent.
 *
 * ─── Design principles ────────────────────────────────────────────────────
 *
 * 1.  FULL REINDEX EVERY TIME
 *     The indexer already does clearIndex() → embed-all → upsert-all in one
 *     atomic operation, so a full reindex is the safest and simplest approach.
 *     Portfolio is small (≤ ~30 documents), so a full reindex takes < 2 s.
 *     This eliminates all stale-vector edge cases.
 *
 * 2.  ATOMIC / SAFE
 *     Embeddings are generated BEFORE clearIndex() is called.
 *     If embedding fails, the old index is left untouched.
 *     If clearIndex() + upsert fails, the error is logged and reported.
 *     MongoDB is never rolled back — CRUD success is always preserved.
 *
 * 3.  SERIALISED QUEUE (no concurrent reindexes)
 *     A simple Promise queue ensures that if two CRUD operations complete
 *     within milliseconds of each other, the second waits for the first
 *     to finish.  The queue always runs the latest-queued state, so the
 *     final Vectra snapshot always reflects the latest MongoDB state.
 *
 * 4.  NON-FATAL
 *     Sync failures are logged but never crash the server or block the
 *     HTTP response.  The CRUD response always includes a `ragSync` field
 *     describing the outcome so the caller can react if needed.
 *
 * ─── Public API ───────────────────────────────────────────────────────────
 *
 *   syncPortfolio()         → queued full reindex
 *   syncAfterCreate(type)   → alias for syncPortfolio (logs context)
 *   syncAfterUpdate(type)   → alias for syncPortfolio (logs context)
 *   syncAfterDelete(type)   → alias for syncPortfolio (logs context)
 *   getSyncStatus()         → { running, queueLength, lastSync, lastError }
 */

const { indexPortfolioDocuments } = require('./portfolioIndexer');

// ─── State ────────────────────────────────────────────────────────────────

let _running    = false;       // true while reindex is in progress
let _queue      = [];          // pending resolve callbacks
let _lastSync   = null;        // ISO timestamp of last successful sync
let _lastError  = null;        // message of last sync failure

// ─── Queue helpers ────────────────────────────────────────────────────────

/**
 * Drain the queue by running the indexer once for the latest state.
 * Called recursively until the queue is empty.
 */
async function _drainQueue() {
  if (_running) return;           // already running — queue will be drained after
  if (_queue.length === 0) return;

  _running = true;

  // Collapse the queue: run one reindex for ALL pending callers,
  // then resolve all of them with the same result.
  const waiters = _queue.splice(0);  // take everyone currently waiting

  let result;
  try {
    console.log(`[RAG Sync] Starting reindex (${waiters.length} operation(s) pending)...`);
    result = await indexPortfolioDocuments();
    _lastSync  = new Date().toISOString();
    _lastError = null;
    console.log(`[RAG Sync] ✓ Reindex complete — ${result.indexed}/${result.totalDocuments} vectors`);
  } catch (err) {
    _lastError = err.message;
    console.error('[RAG Sync] ✗ Reindex failed:', err.message);
    result = { success: false, error: err.message };
  }

  _running = false;

  // Resolve all callers that were waiting for this reindex
  waiters.forEach(resolve => resolve(result));

  // If more callers arrived while we were running, drain again
  if (_queue.length > 0) {
    setImmediate(_drainQueue);
  }
}

/**
 * Enqueue a reindex and return a Promise that resolves when it completes.
 */
function _enqueue() {
  return new Promise(resolve => {
    _queue.push(resolve);
    setImmediate(_drainQueue);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Trigger a full portfolio reindex.
 * Safe to call concurrently — uses the internal queue.
 *
 * @returns {Promise<{indexed, totalDocuments, failed, failures}|{success, error}>}
 */
async function syncPortfolio() {
  return _enqueue();
}

/**
 * Call after a CREATE operation.
 * @param {string} type  e.g. 'project', 'certification', 'experience', 'skill'
 */
async function syncAfterCreate(type) {
  console.log(`[RAG Sync] Triggered by CREATE (${type})`);
  return syncPortfolio();
}

/**
 * Call after an UPDATE operation.
 * @param {string} type
 */
async function syncAfterUpdate(type) {
  console.log(`[RAG Sync] Triggered by UPDATE (${type})`);
  return syncPortfolio();
}

/**
 * Call after a DELETE operation.
 * @param {string} type
 */
async function syncAfterDelete(type) {
  console.log(`[RAG Sync] Triggered by DELETE (${type})`);
  return syncPortfolio();
}

/**
 * Current sync status — useful for admin dashboards or health checks.
 */
function getSyncStatus() {
  return {
    running:     _running,
    queueLength: _queue.length,
    lastSync:    _lastSync,
    lastError:   _lastError
  };
}

module.exports = {
  syncPortfolio,
  syncAfterCreate,
  syncAfterUpdate,
  syncAfterDelete,
  getSyncStatus
};
