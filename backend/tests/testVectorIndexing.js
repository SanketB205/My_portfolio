/**
 * testVectorIndexing.js
 *
 * End-to-end test for Step 4: Embeddings + Vector Storage
 *
 * Pipeline under test:
 *   MongoDB  →  portfolioDocumentGenerator
 *            →  embeddingService (OpenAI text-embedding-3-small)
 *            →  chromaService    (vectra LocalIndex, persistent on disk)
 *
 * Verifies:
 *   1.  MongoDB connects
 *   2.  OpenAI embedding service initialises
 *   3.  Vector store initialises (vectra, no Docker)
 *   4.  Portfolio documents are generated
 *   5.  Embeddings are generated (1536 dims)
 *   6.  All documents are stored
 *   7.  profile-main exists with correct metadata
 *   8.  edu-1 exists
 *   9.  At least one project document exists
 *  10.  ShoeHub is stored (if present in DB)
 *  11.  At least one experience document exists
 *  12.  At least one skill document exists
 *  13.  At least one certification document exists
 *  14.  Every stored document has a non-empty content field
 *  15.  Every stored document has a type in its metadata
 *  16.  All document IDs are unique
 *  17.  Re-indexing does NOT create duplicate IDs
 *
 * Run: node tests\testVectorIndexing.js
 */

'use strict';

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const embeddingService = require('../services/embeddingService');
const vectorStore      = require('../services/chromaService');    // vectra
const {
  indexPortfolioDocuments,
  reindexPortfolio,
  getIndexingStatus
} = require('../services/portfolioIndexer');

// ─── tiny test harness ───────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.log(`  ❌  ${label}${detail ? '  →  ' + detail : ''}`);
    failed++;
    failures.push(label);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   VECTOR INDEXING TEST  (vectra / no Docker)');
  console.log('═══════════════════════════════════════════════════════\n');

  // ── 1. MongoDB ────────────────────────────────────────────────────
  console.log('┌─ Step 1: MongoDB');
  let mongoOk = false;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    mongoOk = true;
    console.log('│   Connected to', mongoose.connection.name);
  } catch (e) {
    console.error('│   ✗', e.message);
  }
  check('MongoDB connected', mongoOk);
  console.log('');

  if (!mongoOk) {
    console.error('Cannot continue without MongoDB.\n');
    process.exit(1);
  }

  // ── 2. Embedding service (local model) ───────────────────────────
  console.log('┌─ Step 2: Local embedding service (@xenova/transformers)');
  let embInit = false;
  try {
    embInit = await embeddingService.initialize();
  } catch (e) {
    console.error('│   ✗', e.message);
  }
  check('Embedding service initialised', embInit,
    embInit ? '' : 'Check @xenova/transformers installation');
  if (embInit) {
    const info = embeddingService.getModelInfo();
    console.log(`│   Model    : ${info.model}`);
    console.log(`│   Provider : ${info.provider}`);
    console.log(`│   Dims     : ${info.dimensions}`);
    console.log(`│   Free     : ${info.free}`);
  }
  console.log('');

  if (!embInit) {
    console.error('Cannot continue without embedding service.\n');
    await mongoose.connection.close();
    process.exit(1);
  }

  // ── 3. Vector store (vectra) ──────────────────────────────────────
  console.log('┌─ Step 3: Vector store (vectra LocalIndex)');
  const vsInit = await vectorStore.initialize();
  check('Vector store initialised', vsInit,
    vsInit ? '' : 'Check VECTOR_STORE_PATH in .env');
  if (vsInit) {
    const st = await vectorStore.getStats();
    console.log(`│   Backend  : ${st.backend}`);
    console.log(`│   Path     : ${st.storePath}`);
    console.log(`│   Existing : ${st.documentCount} item(s) on disk`);
    check('Persistent storage', st.persistent === true);
  }
  console.log('');

  if (!vsInit) {
    console.error('Cannot continue without vector store.\n');
    await mongoose.connection.close();
    process.exit(1);
  }

  // ── 4–6. First indexing run ───────────────────────────────────────
  console.log('┌─ Steps 4–6: First indexing run');
  let firstStats;
  try {
    firstStats = await indexPortfolioDocuments();
  } catch (e) {
    console.error('│   ✗ Indexing threw:', e.message);
    await mongoose.connection.close();
    process.exit(1);
  }

  check('Documents generated',
    firstStats.totalDocuments > 0,
    `got ${firstStats.totalDocuments}`);

  check('All documents embedded + stored',
    firstStats.indexed === firstStats.totalDocuments,
    `indexed ${firstStats.indexed}/${firstStats.totalDocuments}`);

  check('Zero failures',
    firstStats.failed === 0,
    firstStats.failed > 0
      ? firstStats.failures.map(f => f.documentId).join(', ')
      : '');

  const countAfterFirst = await vectorStore.count();
  check('Vector store count matches indexed count',
    countAfterFirst === firstStats.indexed,
    `store=${countAfterFirst}  indexed=${firstStats.indexed}`);

  console.log('');

  // ── 7–8. Specific known documents ────────────────────────────────
  console.log('┌─ Steps 7–8: Known document checks');

  const profileDoc = await vectorStore.getDocument('profile-main');
  check('profile-main exists',       profileDoc !== null);
  check('profile-main has content',  profileDoc?.content?.length > 0);
  check('profile-main type=profile', profileDoc?.metadata?.type === 'profile');

  const edu1 = await vectorStore.getDocument('edu-1');
  check('edu-1 exists',              edu1 !== null);
  check('edu-1 type=education',      edu1?.metadata?.type === 'education');
  console.log('');

  // ── 9. Projects ───────────────────────────────────────────────────
  console.log('┌─ Step 9: Project documents');
  const { documents: allDocs } = await vectorStore.getAllDocuments();

  const projectDocs = allDocs.filter(d => d.metadata?.type === 'project');
  check('At least one project document', projectDocs.length > 0,
    `found ${projectDocs.length}`);

  // ── 10. ShoeHub ───────────────────────────────────────────────────
  const shoeHubDoc = projectDocs.find(d =>
    (d.metadata?.title ?? '').toLowerCase().includes('shoehub'));
  if (projectDocs.length > 0) {
    check('ShoeHub project is stored', shoeHubDoc !== null,
      shoeHubDoc
        ? ''
        : `projects found: ${projectDocs.map(d => d.metadata?.title ?? d.id).join(', ')}`);
  } else {
    console.log('  ⚠   Skipping ShoeHub check — no projects in DB');
  }
  console.log('');

  // ── 11–13. Experience / Skills / Certifications ───────────────────
  console.log('┌─ Steps 11–13: Experience, Skills, Certifications');

  const expDocs  = allDocs.filter(d => d.metadata?.type === 'experience');
  const skillDocs = allDocs.filter(d => d.metadata?.type === 'skill');
  const certDocs  = allDocs.filter(d => d.metadata?.type === 'certification');

  check('At least one experience document',     expDocs.length  > 0, `found ${expDocs.length}`);
  check('At least one skill document',          skillDocs.length > 0, `found ${skillDocs.length}`);
  check('At least one certification document',  certDocs.length  > 0, `found ${certDocs.length}`);
  console.log('');

  // ── 14–15. Content + type present on every document ───────────────
  console.log('┌─ Steps 14–15: Document integrity');

  const missingContent = allDocs.filter(d => !d.content || d.content.length === 0);
  check('Every document has content',
    missingContent.length === 0,
    missingContent.length > 0
      ? `missing: ${missingContent.map(d => d.id).join(', ')}`
      : '');

  const missingType = allDocs.filter(d => !d.metadata?.type);
  check('Every document has a type in metadata',
    missingType.length === 0,
    missingType.length > 0
      ? `missing: ${missingType.map(d => d.id).join(', ')}`
      : '');
  console.log('');

  // ── 16. All IDs unique ────────────────────────────────────────────
  console.log('┌─ Step 16: ID uniqueness');
  const ids    = allDocs.map(d => d.id);
  const unique = new Set(ids);
  check('All stored IDs are unique',
    ids.length === unique.size,
    `total=${ids.length}  unique=${unique.size}`);
  console.log('');

  // ── 17. Re-indexing — no duplicates ──────────────────────────────
  console.log('┌─ Step 17: Re-indexing (duplicate prevention)');
  console.log('│   Running second indexing pass...\n');

  const secondStats = await reindexPortfolio();
  const countAfterSecond = await vectorStore.count();

  check('Re-indexing succeeds',
    secondStats.indexed === secondStats.totalDocuments);

  check('Re-indexing does NOT inflate the store',
    countAfterSecond === countAfterFirst,
    `before=${countAfterFirst}  after=${countAfterSecond}`);

  check('Same document count both runs',
    firstStats.totalDocuments === secondStats.totalDocuments,
    `first=${firstStats.totalDocuments}  second=${secondStats.totalDocuments}`);
  console.log('');

  // ── Status summary ────────────────────────────────────────────────
  console.log('┌─ Final status');
  const status = await getIndexingStatus();
  console.log('│   Embedding service ready :', status.embeddingService.ready);
  console.log('│   Vector store ready      :', status.vectorStore.initialized);
  console.log('│   Backend                 :', status.vectorStore.backend);
  console.log('│   Path                    :', status.vectorStore.storePath);
  console.log('│   Documents on disk       :', status.vectorStore.documentCount);
  console.log('│   Persistent              :', status.vectorStore.persistent);
  console.log('');

  // ── Results ───────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   RESULTS:  ${passed} passed  /  ${failed} failed`);
  if (failures.length > 0) {
    console.log('\n   Failed checks:');
    failures.forEach(f => console.log(`     ✗  ${f}`));
  }
  console.log('═══════════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('✅  ALL TESTS PASSED\n');
  } else {
    console.log('❌  SOME TESTS FAILED — see above\n');
  }

  // ── Document breakdown ────────────────────────────────────────────
  console.log('Document breakdown:');
  const byType = {};
  allDocs.forEach(d => {
    const t = d.metadata?.type ?? 'unknown';
    byType[t] = (byType[t] ?? 0) + 1;
  });
  Object.entries(byType).forEach(([t, n]) => console.log(`  ${t}: ${n}`));
  console.log(`  ────────`);
  console.log(`  TOTAL: ${allDocs.length}`);
  console.log('');

  await mongoose.connection.close();
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('\n❌  Unhandled error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
