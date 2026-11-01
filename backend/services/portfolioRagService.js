'use strict';

/**
 * Portfolio RAG Service
 *
 * Retrieves portfolio documents relevant to a user's question and formats
 * them into a context block ready for the Gemini system prompt.
 *
 * ─── Retrieval strategy ───────────────────────────────────────────────────
 *
 * Step 1 — INTENT DETECTION
 *   Scan the user query for category keywords (project, skill, cert, etc.)
 *   If a category is detected, fetch ALL stored documents of that type
 *   directly from the vector store (no similarity threshold needed).
 *   This handles broad questions like "What projects have I built?" reliably.
 *
 * Step 2 — VECTOR SIMILARITY SEARCH
 *   Always run a cosine similarity search against all documents.
 *   Include results that score ≥ RELEVANCE_THRESHOLD (default 0.30).
 *   These handle specific questions like "Tell me about ShoeHub."
 *
 * Step 3 — MERGE AND DEDUPLICATE
 *   Combine intent-matched docs + similarity-matched docs.
 *   Remove duplicates by document ID.
 *   Cap total at MAX_CONTEXT_DOCS (default 6) to keep the prompt concise.
 *
 * ─── Relevance protection ─────────────────────────────────────────────────
 *   Unrelated queries (e.g. "XYZ Quantum Banking") trigger no intent match
 *   AND all vector scores stay below the threshold → empty context returned.
 *   Gemini then correctly says "I don't have that information."
 *
 * ─── Vectra score semantics ───────────────────────────────────────────────
 *   Cosine similarity 0–1. Higher = more similar.
 *   Empirically calibrated: direct match ≈ 0.55–0.75, related ≈ 0.30–0.50,
 *   unrelated ≈ 0.20. Threshold of 0.30 cleanly separates relevant from noise.
 */

const embeddingService = require('./embeddingService');
const vectorStore      = require('./chromaService');

const DEFAULT_TOP_K             = parseInt(process.env.RAG_TOP_K              ?? '5',    10);
const DEFAULT_THRESHOLD         = parseFloat(process.env.RAG_RELEVANCE_THRESHOLD ?? '0.30');
const MAX_CONTEXT_DOCS          = parseInt(process.env.RAG_MAX_CONTEXT_DOCS   ?? '6',    10);

// ─── Intent keyword map ───────────────────────────────────────────────────
// Maps document types to keywords that, when found in the query, trigger
// a direct type-fetch regardless of similarity score.
const INTENT_KEYWORDS = {
  project:       ['project', 'built', 'developed', 'portfolio', 'app', 'application',
                  'website', 'shoehub', 'ev charging', 'blogweb', 'plant', 'landscaping'],
  skill:         ['skill', 'technology', 'tech stack', 'know', 'language',
                  'programming', 'frontend', 'backend', 'database', 'framework', 'tool'],
  experience:    ['experience', 'internship', 'work', 'worked', 'company', 'job', 'intern',
                  'regex', 'cloudregex', 'position', 'role', 'employ'],
  education:     ['education', 'degree', 'cgpa', 'gpa', 'university', 'college', 'study',
                  'diploma', 'bachelor', 'academic', 'grade', 'score', 'percentage', 'vpkbiet',
                  'msbte', 'baramati'],
  certification: ['certification', 'certificate', 'certified', 'oracle', 'nptel', 'award',
                  'course', 'credential'],
  profile:       ['overview', 'summary', 'portfolio',
                  'sanket', 'bhujbal', 'profile', 'introduce', 'who is',
                  'contact', 'email', 'phone', 'location', 'from', 'address',
                  'reach', 'get in touch', 'hire', 'connect',
                  'github', 'linkedin', 'leetcode', 'social', 'link',
                  'hobby', 'hobbies', 'interest', 'free time', 'passion',
                  'travel', 'driving', 'personal',
                  'resume', 'cv', 'download', 'pdf',
                  'developer', 'owner', 'built', 'created', 'made',
                  'website', 'portfolio website', 'this site', 'this portfolio']
};

// ─── Service class ────────────────────────────────────────────────────────

class PortfolioRagService {
  constructor() {
    this._ready = false;
  }

  async initialize() {
    if (!embeddingService.isReady()) {
      console.error('PortfolioRagService: embedding service is not ready');
      return false;
    }
    if (!vectorStore.isReady()) {
      console.error('PortfolioRagService: vector store is not ready');
      return false;
    }
    this._ready = true;
    console.log('✓ Portfolio RAG service ready');
    return true;
  }

  isReady() { return this._ready; }

  // ─── Main retrieval entry point ─────────────────────────────────

  /**
   * Retrieve relevant portfolio documents for a user query.
   * Combines intent detection + vector similarity.
   *
   * @param {string} query
   * @param {number} [topK]       Max candidates from vector search
   * @param {number} [threshold]  Min cosine score to include from vector search
   * @returns {Promise<Array>}    Deduplicated array of result objects
   */
  async retrieveRelevantDocuments(
    query,
    topK      = DEFAULT_TOP_K,
    threshold = DEFAULT_THRESHOLD
  ) {
    if (!this._ready) throw new Error('PortfolioRagService not initialized');
    if (!query || typeof query !== 'string' || !query.trim()) {
      throw new Error('retrieveRelevantDocuments: query must be a non-empty string');
    }

    const q = query.trim().toLowerCase();
    const resultsMap = new Map();   // id → result object, for dedup

    // ── Step 1: Intent detection → direct type fetch ─────────────
    const detectedTypes = this._detectIntentTypes(q);

    if (detectedTypes.length > 0) {
      const allDocs = await vectorStore.getAllDocuments();

      for (const type of detectedTypes) {
        const typeDocs = allDocs.documents.filter(d => d.metadata?.type === type);
        typeDocs.forEach(d => {
          if (!resultsMap.has(d.id)) {
            resultsMap.set(d.id, {
              id:       d.id,
              score:    1.0,          // intent match — treated as highly relevant
              metadata: d.metadata,
              content:  d.content
            });
          }
        });
      }
    }

    // ── Step 2: Vector similarity search ─────────────────────────
    const queryVector = await embeddingService.generateEmbedding(query.trim());
    const simResults  = await vectorStore.query({
      queryEmbedding: queryVector,
      nResults:       topK
    });

    simResults
      .filter(r => r.score >= threshold)
      .forEach(r => {
        if (!resultsMap.has(r.id)) {
          resultsMap.set(r.id, r);
        }
        // If already present via intent, update score with actual similarity value
        else {
          const existing = resultsMap.get(r.id);
          if (existing.score === 1.0) existing.score = r.score;
        }
      });

    // ── Step 3: Sort by score, cap at MAX_CONTEXT_DOCS ───────────
    const merged = [...resultsMap.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CONTEXT_DOCS);

    return merged;
  }

  // ─── Context building ────────────────────────────────────────────

  /**
   * Convert retrieved documents into a readable context block.
   * Returns empty string when no documents passed retrieval.
   *
   * @param {Array} documents  Output of retrieveRelevantDocuments()
   * @returns {string}
   */
  buildRagContext(documents) {
    if (!documents || documents.length === 0) return '';
    const sections = documents.map(doc => this._formatDocument(doc));
    return 'PORTFOLIO CONTEXT:\n\n' + sections.join('\n\n---\n\n');
  }

  // ─── Private helpers ─────────────────────────────────────────────

  /**
   * Detect which document types are relevant to this query based on
   * keyword matching. Returns an array of type strings (may be empty).
   */
  _detectIntentTypes(queryLower) {
    const matched = [];
    for (const [type, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some(kw => queryLower.includes(kw))) {
        matched.push(type);
      }
    }
    return [...new Set(matched)];  // deduplicate
  }

  /**
   * Format a single document into a labelled section for the Gemini prompt.
   */
  _formatDocument(doc) {
    const meta    = doc.metadata ?? {};
    const content = doc.content  ?? '';
    const type    = meta.type    ?? 'unknown';

    const labels = {
      profile:       'Profile',
      education:     'Education',
      project:       'Project',
      experience:    'Experience / Internship',
      skill:         'Skills',
      certification: 'Certification'
    };
    const label = labels[type] ?? (type.charAt(0).toUpperCase() + type.slice(1));

    const title =
      meta.title    ??
      meta.name     ??
      meta.company  ??
      meta.category ??
      meta.degree   ??
      '';

    const header = title ? `[${label}] ${title}` : `[${label}]`;
    return `${header}\n${content}`;
  }
}

// Singleton
const portfolioRagService = new PortfolioRagService();
module.exports = portfolioRagService;
