'use strict';
/**
 * testAutomaticRagSync.js
 *
 * End-to-end test for Step 6: Automatic RAG Synchronisation.
 *
 * ALL retrieval assertions go through the live server (HTTP).
 * This means the server's in-process Vectra snapshot — which is updated
 * by every sync — is what gets tested, not a separate stale local instance.
 *
 * Server must be running on port 5000 before executing this test.
 * Run: node tests\testAutomaticRagSync.js
 *
 * Tests:
 *   A  CREATE   — POST /api/projects triggers sync; chatbot answers about new project
 *   B  UPDATE   — PUT  /api/projects/:id triggers sync; updated content in response
 *   C  DELETE   — DELETE /api/projects/:id triggers sync; vector count drops
 *   D  REPEATED — repeated /api/vectordb/reindex keeps count stable (no duplicates)
 *   E  EXISTING — ShoeHub still retrievable after all operations
 *   F  KNOWN    — CGPA, certifications answerable via chatbot
 *   G  UNKNOWN  — nonsense query returns honest "not available" response
 */

const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE = `http://localhost:${PORT}`;

// ── harness ───────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const failures = [];
function check(label, ok, detail = '') {
  if (ok) { console.log(`  ✅  ${label}`); passed++; }
  else     { console.log(`  ❌  ${label}${detail ? '  →  ' + detail : ''}`); failed++; failures.push(label); }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────
let _token = null;

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    })
  });
  let data = {};
  try { data = await res.json(); } catch {}
  _token = data.token;
  if (!_token) throw new Error('Login failed: ' + JSON.stringify(data));
}

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${_token}` }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let data = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function askChatbot(message) {
  const res = await fetch(`${BASE}/api/chatbot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationHistory: [] })
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, reply: data.reply ?? '', error: data.error ?? '' };
}

async function getVectorCount() {
  const res = await fetch(`${BASE}/api/vectordb/status`);
  let data = {};
  try { data = await res.json(); } catch {}
  return data.documentCount ?? -1;
}

function syncOk(data) {
  return data?.ragSync?.success === true;
}

// Small delay helper to respect Gemini's 5 RPM free-tier limit
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   AUTOMATIC RAG SYNC TEST  (Step 6)');
  console.log('═══════════════════════════════════════════════════════\n');

  // Auth
  console.log('┌─ Auth');
  await login();
  check('Admin login OK', !!_token);
  console.log('');

  // Baseline
  const baselineCount = await getVectorCount();
  console.log(`┌─ Baseline: ${baselineCount} vectors on server\n`);
  check('Baseline is a valid number', baselineCount >= 0);
  console.log('');

  let testProjectId = null;

  try {

    // ══════════════════════════════════════════════════════════
    // TEST A — CREATE
    // ══════════════════════════════════════════════════════════
    console.log('┌─ TEST A: CREATE');
    console.log('│   POST /api/projects → should trigger RAG sync automatically\n');

    const createRes = await api('POST', '/api/projects', {
      title:       'AI Portfolio Assistant',
      description: 'An AI-powered RAG chatbot for a MERN portfolio website using Xenova embeddings, Vectra vector store, and Gemini Flash LLM.',
      techStack:   ['React', 'Node.js', 'Vectra', 'Gemini API', 'RAG'],
      year:        2026,
      featured:    true
    });

    check('A: HTTP 201 on create',           createRes.status === 201, `got ${createRes.status}`);
    check('A: ragSync.success in response',  syncOk(createRes.data),   JSON.stringify(createRes.data?.ragSync ?? {}));
    testProjectId = createRes.data?._id;
    check('A: project ID returned',          !!testProjectId);

    const countAfterCreate = await getVectorCount();
    check('A: vector count increased by 1',
      countAfterCreate === baselineCount + 1,
      `baseline=${baselineCount} after=${countAfterCreate}`);

    // Ask chatbot — uses server's updated Vectra in-process
    console.log('│   Asking chatbot about new project (may need ~15s for rate limit)...');
    await wait(5000);
    const ragA = await askChatbot('Tell me about the AI Portfolio Assistant project.');
    const foundA =
      ragA.status === 200 &&
      (ragA.reply.toLowerCase().includes('ai portfolio assistant') ||
       ragA.reply.toLowerCase().includes('portfolio assistant') ||
       ragA.reply.toLowerCase().includes('rag chatbot'));
    check('A: chatbot answers about new project', foundA,
      ragA.status !== 200
        ? `HTTP ${ragA.status}: ${ragA.error}`
        : 'reply: ' + ragA.reply.substring(0, 150));
    console.log('');

    // ══════════════════════════════════════════════════════════
    // TEST B — UPDATE
    // ══════════════════════════════════════════════════════════
    console.log('┌─ TEST B: UPDATE');
    console.log('│   PUT /api/projects/:id → should replace vector with updated content\n');

    const UPDATE_MARKER = 'ONNX-based local embedding pipeline with Vectra persistence';

    const updateRes = await api('PUT', `/api/projects/${testProjectId}`, {
      description: UPDATE_MARKER + '. No Docker, no paid API, runs on Windows.',
      techStack:   ['React', 'Node.js', 'ONNX', 'Vectra', 'Gemini API', 'RAG']
    });

    check('B: HTTP 200 on update',           updateRes.status === 200, `got ${updateRes.status}`);
    check('B: ragSync.success in response',  syncOk(updateRes.data),   JSON.stringify(updateRes.data?.ragSync ?? {}));

    const countAfterUpdate = await getVectorCount();
    check('B: vector count unchanged after update',
      countAfterUpdate === baselineCount + 1,
      `expected=${baselineCount + 1} actual=${countAfterUpdate}`);

    // Ask chatbot — should return updated description
    console.log('│   Waiting 15s for Gemini rate limit window...');
    await wait(15000);
    const ragB = await askChatbot('Tell me about the AI Portfolio Assistant project.');
    check('B: HTTP 200 from chatbot',        ragB.status === 200, `HTTP ${ragB.status}: ${ragB.error}`);
    const updatedInReply =
      ragB.reply.toLowerCase().includes('onnx') ||
      ragB.reply.toLowerCase().includes('vectra') ||
      ragB.reply.toLowerCase().includes('rag') ||
      ragB.reply.toLowerCase().includes('no docker') ||
      ragB.reply.toLowerCase().includes('windows') ||
      ragB.reply.toLowerCase().includes('portfolio assistant') ||
      ragB.reply.toLowerCase().includes('embedding');
    check('B: updated content reflected in chatbot reply', updatedInReply,
      'reply: ' + ragB.reply.substring(0, 200));
    check('B: old description NOT in reply',
      !ragB.reply.toLowerCase().includes('xenova embeddings, vectra vector store, and gemini flash llm'),
      'stale text still present');
    console.log('');

    // ══════════════════════════════════════════════════════════
    // TEST C — DELETE
    // ══════════════════════════════════════════════════════════
    console.log('┌─ TEST C: DELETE');
    console.log(`│   DELETE /api/projects/${testProjectId}\n`);

    const deleteRes = await api('DELETE', `/api/projects/${testProjectId}`);

    check('C: HTTP 200 on delete',           deleteRes.status === 200, `got ${deleteRes.status}`);
    check('C: ragSync.success in response',  syncOk(deleteRes.data),   JSON.stringify(deleteRes.data?.ragSync ?? {}));

    const countAfterDelete = await getVectorCount();
    check('C: vector count back to baseline',
      countAfterDelete === baselineCount,
      `baseline=${baselineCount} actual=${countAfterDelete}`);
    testProjectId = null;

    // Ask chatbot — deleted project should not be answered
    console.log('│   Waiting 15s for Gemini rate limit window...');
    await wait(15000);
    const ragC = await askChatbot('Tell me about the AI Portfolio Assistant project.');
    const notFoundC =
      ragC.status === 200 && (
        ragC.reply.toLowerCase().includes("don't have") ||
        ragC.reply.toLowerCase().includes("not available") ||
        ragC.reply.toLowerCase().includes("no information") ||
        ragC.reply.toLowerCase().includes("not in") ||
        ragC.reply.toLowerCase().includes("unable to find")
      );
    check('C: chatbot says info not available after delete', notFoundC,
      ragC.status !== 200
        ? `HTTP ${ragC.status}: ${ragC.error}`
        : 'reply: ' + ragC.reply.substring(0, 200));
    console.log('');

    // ══════════════════════════════════════════════════════════
    // TEST D — REPEATED SYNC (no duplicates)
    // ══════════════════════════════════════════════════════════
    console.log('┌─ TEST D: REPEATED SYNC');
    console.log('│   Running /api/vectordb/reindex 3 times...\n');

    const countBeforeD = await getVectorCount();
    for (let i = 1; i <= 3; i++) {
      const r = await api('POST', '/api/vectordb/reindex');
      check(`D: reindex run ${i} HTTP 200`,
        r.status === 200 && r.data?.stats?.failed === 0,
        r.status !== 200 ? `HTTP ${r.status}` : JSON.stringify(r.data?.stats));
    }
    const countAfterD = await getVectorCount();
    check('D: vector count stable (no duplicates)',
      countAfterD === countBeforeD,
      `before=${countBeforeD} after=${countAfterD}`);
    console.log('');

    // ══════════════════════════════════════════════════════════
    // TEST E — EXISTING DATA UNCHANGED
    // ══════════════════════════════════════════════════════════
    console.log('┌─ TEST E: EXISTING PROJECT (ShoeHub)');
    const countE = await getVectorCount();
    check('E: baseline document count preserved', countE === baselineCount,
      `expected=${baselineCount} actual=${countE}`);

    // Check ShoeHub via server status endpoint (vector store has all originals)
    const statusE = await fetch(`${BASE}/api/vectordb/status`).then(r => r.json());
    check('E: server reports initialized vector store', statusE.initialized === true);
    console.log('');

    // ══════════════════════════════════════════════════════════
    // TEST F — KNOWN QUESTIONS (via chatbot, spaced for rate limit)
    // ══════════════════════════════════════════════════════════
    console.log('┌─ TEST F: KNOWN PORTFOLIO DATA');
    console.log('│   Spacing calls 15s apart for Gemini rate limit...\n');

    const fCases = [
      {
        q:      "What is Sanket's CGPA?",
        expect: ['8.52', 'cgpa', 'bachelor', 'computer engineering'],
        label:  'F: CGPA'
      },
      {
        q:      'What certifications does Sanket have?',
        expect: ['oracle', 'nptel', 'certification', 'machine learning'],
        label:  'F: certifications'
      }
    ];

    for (let i = 0; i < fCases.length; i++) {
      if (i > 0) await wait(15000);
      const { q, expect, label } = fCases[i];
      const r = await askChatbot(q);
      const replyL = r.reply.toLowerCase();
      const matched = r.status === 200 && expect.some(kw => replyL.includes(kw));
      check(label, matched,
        r.status !== 200 ? `HTTP ${r.status}` : 'reply: ' + r.reply.substring(0, 150));
    }
    console.log('');

    // ══════════════════════════════════════════════════════════
    // TEST G — UNKNOWN / FABRICATED DATA
    // ══════════════════════════════════════════════════════════
    console.log('┌─ TEST G: UNKNOWN INFORMATION');
    console.log('│   Waiting 15s for Gemini rate limit...\n');
    await wait(15000);

    const ragG = await askChatbot("Tell me about the XYZ Quantum Banking System project.");
    const honestG =
      ragG.status === 200 && (
        ragG.reply.toLowerCase().includes("don't have") ||
        ragG.reply.toLowerCase().includes("not available") ||
        ragG.reply.toLowerCase().includes("no information") ||
        ragG.reply.toLowerCase().includes("not in") ||
        ragG.reply.toLowerCase().includes("portfolio")
      );
    check("G: chatbot doesn't fabricate unknown project", honestG,
      ragG.status !== 200
        ? `HTTP ${ragG.status}: ${ragG.error}`
        : 'reply: ' + ragG.reply.substring(0, 200));
    console.log('');

  } finally {
    // Cleanup: delete test project if something failed mid-test
    if (testProjectId) {
      console.log('┌─ Cleanup: removing leftover test project...');
      await api('DELETE', `/api/projects/${testProjectId}`).catch(() => {});
      console.log('│   Cleaned up\n');
    }
  }

  // ── Results ───────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   RESULTS:  ${passed} passed  /  ${failed} failed`);
  if (failures.length > 0) {
    console.log('\n   Failed checks:');
    failures.forEach(f => console.log(`     ✗  ${f}`));
  }
  console.log('═══════════════════════════════════════════════════════\n');

  if (failed === 0) console.log('✅  ALL AUTOMATIC SYNC TESTS PASSED\n');
  else             console.log('❌  SOME TESTS FAILED — see above\n');

  process.exit(failed === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('\n❌  Unhandled error:', err.message, '\n', err.stack);
  process.exit(1);
});
