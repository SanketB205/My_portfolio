'use strict';

const { createPortfolioDocuments } = require('../utils/portfolioDocumentGenerator');
const embeddingService = require('./embeddingService');
const vectorStore      = require('./chromaService');   // vectra LocalIndex

/**
 * Portfolio Indexer Service — Memory-optimized for Render Free
 *
 * Pipeline:
 *   1. Generate portfolio documents     (portfolioDocumentGenerator)
 *   2. Batch-embed all documents        (batch size 1, GC between each)
 *   3. Clear + upsert vectors to disk   (vectra LocalIndex)
 *
 * Concurrency: a module-level lock prevents two indexPortfolioDocuments()
 * calls from running simultaneously (startup auto-seed vs CRUD-triggered sync).
 */

// ─── Global indexing lock ────────────────────────────────────────
let _indexingInProgress = false;

// ─── Memory helper ───────────────────────────────────────────────
function logMemory(label) {
  const m = process.memoryUsage();
  console.log(
    `[Memory] ${label}: ` +
    `RSS=${(m.rss / 1048576).toFixed(1)}MB ` +
    `Heap=${(m.heapUsed / 1048576).toFixed(1)}/${(m.heapTotal / 1048576).toFixed(1)}MB ` +
    `Ext=${(m.external / 1048576).toFixed(1)}MB`
  );
}

/**
 * Index all portfolio documents.
 * @returns {Promise<{totalDocuments, indexed, failed, failures[]}>}
 */
async function indexPortfolioDocuments() {
  // ── Concurrency guard ──────────────────────────────────────────
  if (_indexingInProgress) {
    console.log('[Indexer] Already in progress — skipping');
    return { totalDocuments: 0, indexed: 0, failed: 0, failures: [], skipped: true };
  }
  _indexingInProgress = true;

  const stats = {
    totalDocuments: 0,
    indexed:        0,
    failed:         0,
    failures:       []
  };

  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   PORTFOLIO INDEXING');
    console.log('═══════════════════════════════════════════════════════\n');

    // ── Guard ─────────────────────────────────────────────────────
    console.log('📋 Step 1: Checking services...');

    if (!embeddingService.isReady()) {
      throw new Error('Embedding service not ready. Call await embeddingService.initialize() first.');
    }
    console.log('  ✓ Embedding service ready');

    if (!vectorStore.isReady()) {
      throw new Error('Vector store not ready. Call vectorStore.initialize() first.');
    }
    console.log('  ✓ Vector store ready\n');

    // ── Generate documents ────────────────────────────────────────
    console.log('📋 Step 2: Generating portfolio documents...');
    const documents = await createPortfolioDocuments();
    stats.totalDocuments = documents.length;
    console.log(`  ✓ Generated ${documents.length} documents\n`);

    if (documents.length === 0) {
      console.log('⚠  No documents to index');
      return stats;
    }

    // ── Batch embed ───────────────────────────────────────────────
    const batchSize = parseInt(process.env.EMBEDDING_BATCH_SIZE ?? '1', 10);
    console.log(`📋 Step 3: Embedding ${documents.length} documents (batch size ${batchSize})...`);
    logMemory('Before embedding');

    let embeddings;
    try {
      const texts = documents.map(d => d.content);
      embeddings  = await embeddingService.generateEmbeddings(texts);
      console.log(`  ✓ Received ${embeddings.length} embeddings (${embeddings[0].length} dims each)\n`);
      logMemory('After embedding');

      // Hint GC to reclaim the large texts array + inference buffers
      if (typeof global.gc === 'function') global.gc();
    } catch (err) {
      const category = err.category ?? 'embedding_error';
      console.error(`  ✗ Embedding failed [${category}]: ${err.message}\n`);
      logMemory('Embedding failure point');

      documents.forEach(doc => {
        stats.failed++;
        stats.failures.push({
          documentId: doc.id,
          type:       doc.metadata.type,
          error:      err.message,
          category
        });
      });

      _printSummary(stats, 0);
      return stats;
    }

    // ── Store vectors ─────────────────────────────────────────────
    console.log('📋 Step 4: Storing vectors on disk...');
    logMemory('Before clear + store');

    // Clear existing vectors so deleted documents don't leave orphan entries.
    await vectorStore.clearIndex();

    const toStore = documents.map((doc, i) => ({
      id:        doc.id,
      content:   doc.content,
      embedding: embeddings[i],
      metadata:  {
        ...doc.metadata,
        sourceId:  doc.id,
        indexedAt: new Date().toISOString()
      }
    }));

    await vectorStore.upsertDocuments(toStore);
    stats.indexed = toStore.length;
    console.log(`  ✓ Stored ${toStore.length} vectors\n`);
    logMemory('After store');

    // ── Verify ────────────────────────────────────────────────────
    console.log('📋 Step 5: Verifying storage...');
    const storeStats = await vectorStore.getStats();
    console.log(`  ✓ Vector store now contains ${storeStats.documentCount} item(s)\n`);

    _printSummary(stats, storeStats.documentCount);
    return stats;

  } finally {
    _indexingInProgress = false;
  }
}

// ─── Internal helpers ──────────────────────────────────────────────

function _printSummary(stats, storeCount) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   INDEXING COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📊 Summary:');
  console.log('─────────────────────────────────────────────────────');
  console.log(`  Total documents:      ${stats.totalDocuments}`);
  console.log(`  Successfully indexed: ${stats.indexed}`);
  console.log(`  Failed:               ${stats.failed}`);
  console.log(`  In vector store:      ${storeCount}`);
  console.log('');

  if (stats.failed > 0) {
    const byCategory = {};
    stats.failures.forEach(f => {
      const cat = f.category ?? 'unknown';
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    });
    console.log('❌ Failure summary:');
    Object.entries(byCategory).forEach(([cat, n]) =>
      console.log(`  [${cat}] ${n} document(s)`)
    );
    if (stats.failures.length > 0) {
      console.log(`  Sample error: ${stats.failures[0].error}`);
    }
    console.log('');
  }
}

// ─── Public API ────────────────────────────────────────────────────

async function reindexPortfolio() {
  console.log('🔄 Re-indexing portfolio...\n');
  return indexPortfolioDocuments();
}

async function getIndexingStatus() {
  return {
    embeddingService: {
      ready: embeddingService.isReady(),
      model: embeddingService.isReady() ? embeddingService.getModelInfo() : null
    },
    vectorStore:    await vectorStore.getStats(),
    indexingInProgress: _indexingInProgress
  };
}

module.exports = {
  indexPortfolioDocuments,
  reindexPortfolio,
  getIndexingStatus
};
