'use strict';

/**
 * Embedding Service — Memory-optimized for Render Free (512 MB RAM)
 *
 * Model:   Xenova/all-MiniLM-L6-v2  (384 dims, int8 quantized ONNX)
 * Source:  https://huggingface.co/Xenova/all-MiniLM-L6-v2
 *
 * Memory strategy:
 *   - quantized: true  → loads int8 ONNX weights (~22 MB, not ~90 MB fp32)
 *   - batch size 1     → processes one text at a time, releases tensor before next
 *   - global.gc()      → forces V8 GC between batches to reclaim inference buffers
 *   - Single pipeline  → model loaded once per process, cached via _initPromise
 *   - Single-threaded   → env.wasm.numThreads = 1 (no worker overhead on 1-CPU instances)
 */

// ─── Memory diagnostics ───────────────────────────────────────────

function logMemory(label) {
  const m = process.memoryUsage();
  console.log(
    `[Memory] ${label}: ` +
    `RSS=${(m.rss / 1048576).toFixed(1)}MB ` +
    `Heap=${(m.heapUsed / 1048576).toFixed(1)}/${(m.heapTotal / 1048576).toFixed(1)}MB ` +
    `Ext=${(m.external / 1048576).toFixed(1)}MB ` +
    `ArrayBuf=${(m.arrayBuffers / 1048576).toFixed(1)}MB`
  );
}

class EmbeddingService {
  constructor() {
    this._extractor    = null;
    this._initPromise  = null;       // cached — prevents double-loading
    this._model        = process.env.LOCAL_EMBEDDING_MODEL
                           ?? 'Xenova/all-MiniLM-L6-v2';
    this._dimensions   = 384;
    this.isInitialized = false;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────

  /**
   * Load the ONNX model.  Singleton: concurrent callers share one promise.
   */
  async initialize() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = this._doInitialize();
    return this._initPromise;
  }

  async _doInitialize() {
    try {
      logMemory('Before model import');
      console.log(`✓ Loading local embedding model: ${this._model} (quantized)`);

      const { pipeline, env } = await import('@xenova/transformers');

      // Redirect cache if configured
      if (process.env.HF_CACHE_DIR) {
        env.cacheDir = process.env.HF_CACHE_DIR;
      }

      // Single-threaded WASM — no worker overhead on Render Free (1 CPU)
      if (env.wasm) {
        env.wasm.numThreads = 1;
      }

      logMemory('After import, before pipeline creation');

      // Explicitly request quantized (int8) model — ~22 MB vs ~90 MB fp32
      this._extractor = await pipeline('feature-extraction', this._model, {
        quantized: true,
      });

      this.isInitialized = true;
      logMemory('After model loaded');
      console.log(`✓ Embedding model ready (${this._dimensions} dims, local/offline)`);
      return true;
    } catch (err) {
      console.error('Failed to load local embedding model:', err.message);
      this.isInitialized = false;
      this._initPromise  = null;   // allow retry
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
      free:        true,
      requiresAPI: false,
      quantized:   true,
    };
  }

  // ─── Single embedding ────────────────────────────────────────────

  /**
   * Embed one text string → 384-dim vector.
   * Used for query-time embeddings (one per chatbot request).
   */
  async generateEmbedding(text) {
    this._assertReady();

    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('generateEmbedding: text must be a non-empty string');
    }

    const output = await this._extractor(text.trim(), {
      pooling:   'mean',
      normalize: true,
    });

    // Convert Float32Array → regular array, then release the tensor
    const vec = Array.from(output.data);
    output.dispose?.();
    return vec;
  }

  // ─── Batch embedding — memory-optimized ─────────────────────────

  /**
   * Embed multiple texts.  Order is preserved: result[i] ↔ texts[i].
   *
   * Processes ONE text at a time (EMBEDDING_BATCH_SIZE defaults to 1) to
   * keep peak ONNX memory low.  Calls global.gc() between texts to
   * reclaim inference buffers before the next allocation.
   *
   * @param  {string[]}   texts
   * @returns {Promise<number[][]>}  Array of 384-dim vectors
   */
  async generateEmbeddings(texts) {
    this._assertReady();

    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('generateEmbeddings: texts must be a non-empty array');
    }

    const batchSize = parseInt(process.env.EMBEDDING_BATCH_SIZE ?? '1', 10);
    const results   = new Array(texts.length);
    let   processed = 0;

    logMemory(`Embedding start (${texts.length} texts, batch=${batchSize})`);

    for (let start = 0; start < texts.length; start += batchSize) {
      const end   = Math.min(start + batchSize, texts.length);
      const chunk = texts.slice(start, end).map(t => (t ?? '').trim());

      let vectors;

      if (chunk.length === 1) {
        // Single-text path — most memory-efficient
        const output = await this._extractor(chunk[0], {
          pooling:   'mean',
          normalize: true,
        });
        vectors = [Array.from(output.data)];
        output.dispose?.();
      } else {
        // Small batch (2+)
        const output = await this._extractor(chunk, {
          pooling:   'mean',
          normalize: true,
        });

        const flat = output.data;
        const expected = chunk.length * this._dimensions;

        if (flat.length !== expected) {
          output.dispose?.();
          throw new Error(`Embedding shape mismatch: expected ${expected}, got ${flat.length}`);
        }

        vectors = [];
        for (let i = 0; i < chunk.length; i++) {
          vectors.push(Array.from(flat.subarray(i * this._dimensions, (i + 1) * this._dimensions)));
        }
        output.dispose?.();
      }

      // Store results at correct positions
      for (let i = 0; i < vectors.length; i++) {
        results[start + i] = vectors[i];
      }

      processed += chunk.length;

      // Force GC between batches to reclaim ONNX inference buffers.
      // Only works if Node was started with --expose-gc, which is safe to
      // call even without it (the optional chaining returns undefined).
      if (typeof global.gc === 'function') {
        global.gc();
      }

      if (texts.length > 3) {
        logMemory(`Embedded ${processed}/${texts.length}`);
      }
    }

    // Verify all slots filled
    for (let i = 0; i < results.length; i++) {
      if (!results[i]) {
        throw new Error(`Embedding missing for text at index ${i}`);
      }
    }

    logMemory(`Embedding complete (${results.length} vectors)`);
    return results;
  }

  // ─── Private helpers ────────────────────────────────────────────

  _assertReady() {
    if (!this.isReady()) {
      throw new Error(
        'Embedding service not ready. ' +
        'Call await embeddingService.initialize() before use.'
      );
    }
  }
}

// Singleton
const embeddingService = new EmbeddingService();
module.exports = embeddingService;
