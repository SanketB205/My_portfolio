const { createPortfolioDocuments } = require('../utils/portfolioDocumentGenerator');
const embeddingService = require('./embeddingService');
const vectorStore      = require('./chromaService');   // vectra LocalIndex

/**
 * Portfolio Indexer Service
 *
 * Pipeline:
 *   1. Generate portfolio documents     (portfolioDocumentGenerator)
 *   2. Batch-embed all documents        (one OpenAI API call for all 17)
 *   3. Upsert vectors to disk           (vectra LocalIndex — no Docker)
 *
 * Idempotent: deterministic IDs + upsert = safe to run multiple times.
 *
 * Batch embedding reduces API calls from N → ceil(N / EMBEDDING_BATCH_SIZE),
 * staying well within rate limits and minimising cost.
 */

/**
 * Index all portfolio documents.
 * @returns {Promise<{totalDocuments, indexed, failed, failures[]}>}
 */
async function indexPortfolioDocuments() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   PORTFOLIO INDEXING');
  console.log('═══════════════════════════════════════════════════════\n');

  const stats = {
    totalDocuments: 0,
    indexed:        0,
    failed:         0,
    failures:       []
  };

  // ── Guard ─────────────────────────────────────────────────────────
  console.log('📋 Step 1: Checking services...');

  if (!embeddingService.isReady()) {
    throw new Error('Embedding service not ready. Call await embeddingService.initialize() first.');
  }
  console.log('  ✓ Embedding service ready');

  if (!vectorStore.isReady()) {
    throw new Error('Vector store not ready. Call vectorStore.initialize() first.');
  }
  console.log('  ✓ Vector store ready\n');

  // ── Generate documents ────────────────────────────────────────────
  console.log('📋 Step 2: Generating portfolio documents...');
  const documents = await createPortfolioDocuments();
  stats.totalDocuments = documents.length;
  console.log(`  ✓ Generated ${documents.length} documents\n`);

  if (documents.length === 0) {
    console.log('⚠  No documents to index');
    return stats;
  }

  // ── Batch embed ───────────────────────────────────────────────────
  console.log('📋 Step 3: Batch embedding all documents...');
  console.log(`  Sending ${documents.length} texts in one batch request`);
  console.log(`  (batch size: ${process.env.EMBEDDING_BATCH_SIZE ?? 20})\n`);

  let embeddings;
  try {
    const texts = documents.map(d => d.content);
    embeddings  = await embeddingService.generateEmbeddings(texts);
    console.log(`  ✓ Received ${embeddings.length} embeddings (${embeddings[0].length} dims each)\n`);
  } catch (err) {
    // Classify the error for the caller
    const category = err.category ?? 'api_error';
    console.error(`  ✗ Embedding failed [${category}]: ${err.message}\n`);

    // All documents failed — record each one
    documents.forEach(doc => {
      stats.failed++;
      stats.failures.push({
        documentId: doc.id,
        type:       doc.metadata.type,
        error:      err.message,
        category
      });
    });

    // Return stats — do not store any incomplete vectors
    _printSummary(stats, 0);
    return stats;
  }

  // ── Store vectors ─────────────────────────────────────────────────
  console.log('📋 Step 4: Storing vectors on disk...');

  // Clear existing vectors first so deleted documents don't leave orphan entries.
  // After clear, the count will exactly match what's in MongoDB.
  await vectorStore.clearIndex();

  const toStore = documents.map((doc, i) => ({
    id:        doc.id,
    content:   doc.content,
    embedding: embeddings[i],          // order preserved: doc[i] → embedding[i]
    metadata:  {
      ...doc.metadata,
      sourceId:  doc.id,
      indexedAt: new Date().toISOString()
    }
  }));

  await vectorStore.upsertDocuments(toStore);
  stats.indexed = toStore.length;
  console.log(`  ✓ Stored ${toStore.length} vectors\n`);

  // ── Verify ────────────────────────────────────────────────────────
  console.log('📋 Step 5: Verifying storage...');
  const storeStats = await vectorStore.getStats();
  console.log(`  ✓ Vector store now contains ${storeStats.documentCount} item(s)\n`);

  _printSummary(stats, storeStats.documentCount);
  return stats;
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
    // Group by category to keep output readable
    const byCategory = {};
    stats.failures.forEach(f => {
      const cat = f.category ?? 'unknown';
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    });
    console.log('❌ Failure summary:');
    Object.entries(byCategory).forEach(([cat, n]) =>
      console.log(`  [${cat}] ${n} document(s)`)
    );
    // Print the first failure message as a representative sample
    if (stats.failures.length > 0) {
      console.log(`  Sample error: ${stats.failures[0].error}`);
    }
    console.log('');
  }
}

// ─── Public API ────────────────────────────────────────────────────

/** Re-index — identical to indexPortfolioDocuments (upsert = idempotent). */
async function reindexPortfolio() {
  console.log('🔄 Re-indexing portfolio...\n');
  return indexPortfolioDocuments();
}

/** Current status of both services. */
async function getIndexingStatus() {
  return {
    embeddingService: {
      ready: embeddingService.isReady(),
      model: embeddingService.isReady() ? embeddingService.getModelInfo() : null
    },
    vectorStore: await vectorStore.getStats()
  };
}

module.exports = {
  indexPortfolioDocuments,
  reindexPortfolio,
  getIndexingStatus
};
