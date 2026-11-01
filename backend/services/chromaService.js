const path = require('path');
const { LocalIndex } = require('vectra');

/**
 * Vector Store Service — backed by vectra LocalIndex
 *
 * Replaces the previous chromadb HTTP-based implementation.
 *
 * Why vectra?
 *   - No server, no Docker, no external process
 *   - Data stored as plain JSON files in VECTOR_STORE_PATH
 *   - Genuinely persistent: survives Node restarts
 *   - upsertItem({ id, vector, metadata }) prevents duplicates via
 *     deterministic IDs (same ID = update in place)
 *   - Accepts pre-computed vectors — we own all embedding logic in
 *     embeddingService.js; vectra never touches the OpenAI API
 *
 * On-disk layout:
 *   backend/vector_store/
 *     index.json   ← all items + vectors (written atomically by vectra)
 */

class VectorStoreService {
  constructor() {
    this._index = null;
    this._ready = false;

    const storePath =
      process.env.VECTOR_STORE_PATH ||
      path.join(__dirname, '..', 'vector_store');

    this._storePath = storePath;
  }

  // ─────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────

  /**
   * Initialize the index.
   * Creates the folder and index.json on first run;
   * loads existing data on subsequent runs.
   */
  async initialize() {
    try {
      this._index = new LocalIndex(this._storePath);

      if (!(await this._index.isIndexCreated())) {
        await this._index.createIndex({ version: 1 });
        console.log('✓ Vector store created at', this._storePath);
      } else {
        console.log('✓ Vector store loaded from', this._storePath);
      }

      const stats = await this._index.getIndexStats();
      console.log(`✓ Vector store ready — ${stats.items} item(s) on disk`);

      this._ready = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize vector store:', err.message);
      this._ready = false;
      return false;
    }
  }

  isReady() {
    return this._ready && this._index !== null;
  }

  // ─────────────────────────────────────────────────
  // Write operations
  // ─────────────────────────────────────────────────

  /**
   * Store or update a single document.
   * Calling with the same `id` updates the existing entry — no duplicate.
   *
   * @param {string}         id        Deterministic ID from portfolioDocumentGenerator
   * @param {string}         content   Plain-text document content (stored in metadata)
   * @param {number[]}       embedding 1536-dim vector from embeddingService
   * @param {Object}         metadata  Arbitrary metadata from portfolioDocumentGenerator
   */
  async upsertDocument({ id, content, embedding, metadata }) {
    this._assertReady();
    if (!id || !content || !embedding || !metadata) {
      throw new Error('upsertDocument: id, content, embedding and metadata are all required');
    }

    await this._index.upsertItem({
      id,
      vector: embedding,
      metadata: { ...metadata, content, sourceId: id }
    });
    return true;
  }

  /**
   * Batch store / update.  More efficient than looping upsertDocument
   * because vectra wraps the whole batch in a single atomic write.
   *
   * @param {Array<{id, content, embedding, metadata}>} documents
   */
  async upsertDocuments(documents) {
    this._assertReady();
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error('upsertDocuments: documents must be a non-empty array');
    }

    // vectra's beginUpdate / endUpdate gives us a single atomic commit
    await this._index.beginUpdate();
    try {
      for (const doc of documents) {
        if (!doc.id || !doc.content || !doc.embedding || !doc.metadata) {
          throw new Error(`Document missing required fields: ${doc.id ?? '(no id)'}`);
        }
        await this._index.upsertItem({
          id: doc.id,
          vector: doc.embedding,
          metadata: { ...doc.metadata, content: doc.content, sourceId: doc.id }
        });
      }
      await this._index.endUpdate();
    } catch (err) {
      await this._index.cancelUpdate();
      throw err;
    }
    return true;
  }

  // ─────────────────────────────────────────────────
  // Read operations
  // ─────────────────────────────────────────────────

  /**
   * Retrieve a single document by its deterministic ID.
   * Returns null when not found.
   */
  async getDocument(id) {
    this._assertReady();
    try {
      const item = await this._index.getItem(id);
      if (!item) return null;
      return this._toDocument(item);
    } catch {
      return null;
    }
  }

  /**
   * Return every stored document (metadata only, no vectors).
   */
  async getAllDocuments() {
    this._assertReady();
    const items = await this._index.listItems();
    return {
      count: items.length,
      documents: items.map(this._toDocument)
    };
  }

  /**
   * Number of documents currently stored.
   */
  async count() {
    if (!this._ready) return 0;
    try {
      const stats = await this._index.getIndexStats();
      return stats.items;
    } catch {
      return 0;
    }
  }

  /**
   * Semantic similarity search using a pre-computed query embedding.
   * Returns top-N results sorted by cosine similarity (highest first).
   *
   * @param {number[]} queryEmbedding  1536-dim vector
   * @param {number}   nResults        How many results to return (default 3)
   */
  async query({ queryEmbedding, nResults = 3 }) {
    this._assertReady();
    // vectra signature: queryItems(vector, query, topK)
    const results = await this._index.queryItems(queryEmbedding, '', nResults);
    return results.map(r => ({
      id: r.item.id,
      score: r.score,
      metadata: r.item.metadata,
      content: r.item.metadata.content ?? null
    }));
  }

  // ─────────────────────────────────────────────────
  // Maintenance
  // ─────────────────────────────────────────────────

  /**
   * Delete specific documents by ID.
   */
  async deleteDocuments(ids) {
    this._assertReady();
    if (!Array.isArray(ids) || ids.length === 0) return true;
    for (const id of ids) {
      await this._index.deleteItem(id);
    }
    return true;
  }

  /**
   * Wipe the entire index and start fresh.
   * DESTRUCTIVE — use with caution.
   */
  async clearIndex() {
    this._assertReady();
    await this._index.deleteIndex();
    await this._index.createIndex({ version: 1 });
    console.log('✓ Vector store cleared');
    return true;
  }

  /**
   * Summary stats for health checks / admin dashboard.
   */
  async getStats() {
    if (!this._ready) {
      return {
        initialized: false,
        storePath: this._storePath,
        documentCount: 0
      };
    }
    const stats = await this._index.getIndexStats();
    return {
      initialized: true,
      storePath: this._storePath,
      documentCount: stats.items,
      persistent: true,
      backend: 'vectra@0.15.0'
    };
  }

  // ─────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────

  _assertReady() {
    if (!this._ready) {
      throw new Error('Vector store not initialized. Call initialize() first.');
    }
  }

  _toDocument(item) {
    const { content, ...rest } = item.metadata ?? {};
    return {
      id: item.id,
      content: content ?? null,
      metadata: rest
    };
  }
}

// Singleton — one shared instance across the app
const vectorStoreService = new VectorStoreService();

module.exports = vectorStoreService;
