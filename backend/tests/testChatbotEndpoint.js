'use strict';
/**
 * testChatbotEndpoint.js
 * Tests the live POST /api/chatbot endpoint with 7 questions.
 * Run: node tests\testChatbotEndpoint.js
 * (server must be running on port 5000)
 */

const PORT = process.env.PORT || 5000;

async function ask(question) {
  const res = await fetch(`http://localhost:${PORT}/api/chatbot`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ message: question, conversationHistory: [] })
  });
  const data = await res.json();
  return { status: res.status, reply: data.reply, error: data.error };
}

const QUESTIONS = [
  'Tell me about the ShoeHub project.',
  "What is Sanket's CGPA?",
  'What projects has Sanket built?',
  'What technologies and skills does Sanket know?',
  'What certifications does Sanket have?',
  'Where did Sanket intern? Tell me about Regex Technologies and CloudRegex.',
  'Tell me about a project called XYZ Quantum Banking System.',
];

(async () => {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   CHATBOT ENDPOINT TEST  (live Gemini + RAG)');
  console.log('═══════════════════════════════════════════════════════\n');

  let passed = 0, failed = 0;

  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    console.log(`Q${i + 1}: ${q}`);
    try {
      const { status, reply, error } = await ask(q);
      if (status === 200 && reply) {
        console.log(`  ✅  HTTP ${status}`);
        console.log(`  Reply: ${reply.substring(0, 220).replace(/\n/g, ' ')}${reply.length > 220 ? '…' : ''}`);
        passed++;
      } else {
        console.log(`  ❌  HTTP ${status}  error: ${error ?? '(no reply)'}`);
        failed++;
      }
    } catch (e) {
      console.log(`  ❌  fetch failed: ${e.message}`);
      failed++;
    }
    console.log('');
    // small pause to respect Gemini rate limits
    if (i < QUESTIONS.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log(`   RESULTS: ${passed} passed / ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════\n');
  process.exit(failed === 0 ? 0 : 1);
})();
