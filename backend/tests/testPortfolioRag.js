'use strict';
/**
 * testPortfolioRag.js
 *
 * Tests the RAG retrieval layer directly — no LLM calls, no server needed.
 *
 * For each query it verifies:
 *   - at least one document was retrieved above the relevance threshold
 *   - the expected document TYPE or KEYWORD appears in results
 *   - prints: query / retrieved IDs / types / titles / scores
 *
 * Run: node tests\testPortfolioRag.js
 */

const dotenv = require('dotenv');
dotenv.config();

const embeddingService    = require('../services/embeddingService');
const vectorStore         = require('../services/chromaService');
const portfolioRagService = require('../services/portfolioRagService');

// ─── tiny test harness ────────────────────────────────────────────
let passed = 0, failed = 0;
const failures = [];
function check(label, ok, detail = '') {
  if (ok) { console.log(`    ✅  ${label}`); passed++; }
  else     { console.log(`    ❌  ${label}${detail ? '  →  ' + detail : ''}`); failed++; failures.push(label); }
}

// ─── query cases ──────────────────────────────────────────────────
const CASES = [
  {
    id:          'shoehub',
    query:       'Tell me about my ShoeHub project.',
    expectType:  'project',
    expectKeyword: 'shoehub',
    expectFound: true,
  },
  {
    id:          'cgpa',
    query:       'What is my CGPA?',
    expectType:  'education',
    expectKeyword: null,
    expectFound: true,
  },
  {
    id:          'technologies',
    query:       'What technologies do I know?',
    expectType:  'skill',
    expectKeyword: null,
    expectFound: true,
  },
  {
    id:          'experience',
    query:       'What internships has Sanket completed? Tell me about Regex Technologies and CloudRegex.',
    expectType:  'experience',
    expectKeyword: null,
    expectFound: true,
  },
  {
    id:          'certifications',
    query:       'What certifications do I have?',
    expectType:  'certification',
    expectKeyword: null,
    expectFound: true,
  },
  {
    id:          'ev_charging',
    query:       'Tell me about my EV charging project.',
    expectType:  'project',
    expectKeyword: 'ev',
    expectFound: true,
  },
  {
    id:          'profile',
    query:       'Sanket Bhujbal profile background developer skills education',
    expectType:  'profile',
    expectKeyword: null,
    expectFound: true,
  },
  {
    id:          'nonsense',
    query:       'Tell me about XYZ Quantum Banking System.',
    expectType:  null,
    expectKeyword: null,
    expectFound: false,      // expect NO results above threshold
  },
];

// ─── main ─────────────────────────────────────────────────────────
async function run() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   PORTFOLIO RAG RETRIEVAL TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  // Initialise services
  console.log('┌─ Initialising services...');
  const embOk = await embeddingService.initialize();
  check('Embedding service ready', embOk);

  const vsOk = await vectorStore.initialize();
  check('Vector store ready', vsOk);
  if (vsOk) {
    const st = await vectorStore.getStats();
    console.log(`│   ${st.documentCount} vectors on disk`);
    if (st.documentCount === 0) {
      console.error('\n❌  Vector store is empty — run node tests\\testVectorIndexing.js first\n');
      process.exit(1);
    }
  }

  const ragOk = await portfolioRagService.initialize();
  check('RAG service ready', ragOk);
  console.log('');

  if (!embOk || !vsOk || !ragOk) {
    console.error('Cannot run retrieval tests without all services ready.\n');
    process.exit(1);
  }

  // Run each case
  for (const tc of CASES) {
    console.log(`┌─ [${tc.id}]  "${tc.query}"`);

    let docs;
    try {
      docs = await portfolioRagService.retrieveRelevantDocuments(tc.query);
    } catch (e) {
      console.error(`│   ✗ Retrieval threw: ${e.message}`);
      check(`${tc.id}: retrieval did not throw`, false, e.message);
      console.log('');
      continue;
    }

    // Print result table
    if (docs.length === 0) {
      console.log('│   (no documents above threshold)');
    } else {
      docs.forEach(d => {
        const title = d.metadata?.title ?? d.metadata?.category ?? d.metadata?.company ?? d.metadata?.degree ?? '—';
        console.log(`│   score=${d.score.toFixed(4)}  type=${d.metadata?.type ?? '?'}  id=${d.id}  title="${title}"`);
      });
    }

    // ── Checks ──────────────────────────────────────────────────
    if (tc.expectFound) {
      check(`${tc.id}: at least one result retrieved`,
        docs.length > 0,
        `got ${docs.length}`);

      if (tc.expectType) {
        const hasType = docs.some(d => d.metadata?.type === tc.expectType);
        check(`${tc.id}: result includes type="${tc.expectType}"`,
          hasType,
          hasType ? '' : `types found: ${[...new Set(docs.map(d => d.metadata?.type))].join(', ')}`);
      }

      if (tc.expectKeyword) {
        const kw = tc.expectKeyword.toLowerCase();
        const hasKw = docs.some(d =>
          (d.content ?? '').toLowerCase().includes(kw) ||
          (d.metadata?.title ?? '').toLowerCase().includes(kw)
        );
        check(`${tc.id}: result contains keyword "${tc.expectKeyword}"`, hasKw);
      }

      // Print the context block that would be sent to Gemini
      const ctx = portfolioRagService.buildRagContext(docs);
      console.log(`│   Context block: ${ctx.length} chars`);

    } else {
      // Expect NO results above threshold (nonsense query)
      check(`${tc.id}: no irrelevant results returned`,
        docs.length === 0,
        docs.length > 0
          ? `got ${docs.length} doc(s): ${docs.map(d => `${d.id}(${d.score.toFixed(3)})`).join(', ')}`
          : '');

      const ctx = portfolioRagService.buildRagContext(docs);
      check(`${tc.id}: context block is empty for nonsense query`,
        ctx.trim().length === 0);
    }

    console.log('');
  }

  // ─── Results ──────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   RESULTS:  ${passed} passed  /  ${failed} failed`);
  if (failures.length > 0) {
    console.log('\n   Failed checks:');
    failures.forEach(f => console.log(`     ✗  ${f}`));
  }
  console.log('═══════════════════════════════════════════════════════\n');

  if (failed === 0) console.log('✅  ALL RAG RETRIEVAL TESTS PASSED\n');
  else             console.log('❌  SOME TESTS FAILED — see above\n');

  process.exit(failed === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('\n❌  Unhandled error:', err.message, '\n', err.stack);
  process.exit(1);
});
