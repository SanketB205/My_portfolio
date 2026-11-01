'use strict';

/**
 * Embedding Service
 *
 * Generates vector embeddings locally using @xenova/transformers (ONNX runtime).
 * No API key, no Docker, no paid service — runs fully on-device.
 *
 * Model:   Xenova/all-MiniLM-L6-v2
 * Dims:    384
 * Type:    sentence-transformers  (cosine similarity, normalized)
 * Source:  https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
 *
 * The model is downloaded once from HuggingFace on first use and cached at
 *   %USERPROFILE%\.cache\huggingface\hub\   (Windows default)
 * or the path in env var HF_CACHE_DIR.
 *
 * Interface (unchanged from the OpenAI version):
 *   generateEmbedding(text)    → Promise<number[]>     single 384-dim vector
 *   generateEmbeddings(texts)  → Promise<number[][]>   batch, order preserved
 *   getModelInfo()             → { model, dimensions, provider, ... }
 *   isReady()                  → boolean
 *   initialize()               → Promise<boolean>
 *
 * NOTE: OpenAI is NOT used for embeddings at all in this file.
 * If the chatbot needs to embed user queries at runtime it will call
 * generateEmbedding() here — no OpenAI key needed.
 */

class EmbeddingService {
  constructor() {
    this._extractor    = null;         // HuggingFace pipeline instance
    this._model        = process.env.LOCAL_EMBEDDING_MODEL
                           ?? 'Xenova/all-MiniLM-L6-v2';
    this._dimensions   = 384;          // fixed for all-MiniLM-L6-v2
    this.isInitialized = false;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────

  /**
   * Download (first run) or load (subsequent runs) the ONNX model.
   * Call once at startup; await before making embed requests.
   */
  async initialize() {
    try {
      console.log(`✓ Loading local embedding model: ${this._model}`);
      console.log('  (downloading ONNX weights on first run — ~25 MB)');

      const { pipeline, env } = await import('@xenova/transformers');

      // Optional: redirect the model cache via env variable
      if (process.env.HF_CACHE_DIR) {
        env.cacheDir = process.env.HF_CACHE_DIR;
      }

      this._extractor    = await pipeline('feature-extraction', this._model);
      this.isInitialized = true;

      console.log(`✓ Embedding model ready  (${this._dimensions} dims, local/offline)`);
      return true;
    } catch (err) {
      console.error('Failed to load local embedding model:', err.message);
      this.isInitialized = false;
      return false;
    }
  }

  isReady() {
    return this.isInitialized && this._extractor !== null;
  }

  getModelInfo() {
    return {
      model:      this._model,
      dimensions: this._dimensions,
      provider:   'local (Xenova/all-MiniLM-L6-v2 via @xenova/transformers)',
      free:       true,
      requiresAPI: false
    };
  }

  // ─── Single embedding ────────────────────────────────────────────

  /**
   * Embed one text string.
   * @param  {string}   text
   * @returns {Promise<number[]>}  384-dim vector
   */
  async generateEmbedding(text) {
    this._assertReady();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('generateEmbedding: text must be a non-empty string');
    }

    const output = await this._extractor(text.trim(), {
      pooling:   'mean',
      normalize: true
    });

    return Array.from(output.data);
  }

  // ─── Batch embedding ─────────────────────────────────────────────

  /**
   * Embed multiple texts.  Order is preserved: result[i] ↔ texts[i].
   * Processed in chunks of EMBEDDING_BATCH_SIZE (default 20) to cap
   * peak memory — though local inference is not API-rate-limited.
   *
   * @param  {string[]}   texts
   * @returns {Promise<number[][]>}  Array of 384-dim vectors
   */
  async generateEmbeddings(texts) {
    this._assertReady();

    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('generateEmbeddings: texts must be a non-empty array');
    }

    const batchSize = parseInt(process.env.EMBEDDING_BATCH_SIZE ?? '20', 10);
    const results   = [];

    for (let start = 0; start < texts.length; start += batchSize) {
      const chunk = texts.slice(start, start + batchSize).map(t => (t ?? '').trim());

      // @xenova/transformers accepts a string array directly
      const output = await this._extractor(chunk, {
        pooling:   'mean',
        normalize: true
      });

      // output.data is a flat Float32Array: [dim0…dim383, dim0…dim383, …]
      const flat = Array.from(output.data);

      if (flat.length !== chunk.length * this._dimensions) {
        throw new Error(
          `Embedding shape mismatch: expected ${chunk.length * this._dimensions} ` +
          `floats, got ${flat.length}`
        );
      }

      for (let i = 0; i < chunk.length; i++) {
        results.push(flat.slice(i * this._dimensions, (i + 1) * this._dimensions));
      }
    }

    if (results.length !== texts.length) {
      throw new Error(
        `Embedding count mismatch: expected ${texts.length}, got ${results.length}`
      );
    }

    return results;
  }

  // ─── Private helpers ────────────────────────────────────────────

  _assertReady() {
    if (!this.isReady()) {
      const hint = this.isInitialized === false
        ? 'Call await embeddingService.initialize() before use.'
        : 'Model failed to load — check @xenova/transformers installation.';
      throw new Error(`Embedding service not ready. ${hint}`);
    }
  }
}

// Singleton
const embeddingService = new EmbeddingService();
module.exports = embeddingService;
