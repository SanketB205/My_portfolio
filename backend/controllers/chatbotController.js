'use strict';

/**
 * Chatbot Controller — RAG-powered
 *
 * Flow per request:
 *   1. Validate incoming message
 *   2. Retrieve relevant portfolio documents from Vectra (RAG)
 *   3. Build a dynamic context block from retrieved docs
 *   4. Inject context into Gemini system prompt
 *   5. Return Gemini reply
 *
 * The static PORTFOLIO_CONTEXT has been removed.
 * All portfolio knowledge comes from the vector store.
 *
 * SECURITY:
 *   - GEMINI_API_KEY is read strictly via process.env — never logged or echoed.
 *   - No portfolio facts are hardcoded here.
 */

const portfolioRagService = require('../services/portfolioRagService');

// ─── Gemini model priority list ──────────────────────────────────
// Models that support thinkingConfig (set to true); others get plain config
const CANDIDATE_MODELS = [
  { name: 'gemini-3.6-flash',     thinking: true  },
  { name: 'gemini-3.5-flash-lite', thinking: false },
  { name: 'gemini-flash-latest',  thinking: false },
];

// ─── System prompt template ──────────────────────────────────────
/**
 * Build the Gemini system instruction.
 *
 * @param {string} ragContext  Output of portfolioRagService.buildRagContext()
 *                             May be an empty string when no relevant docs found.
 */
function buildSystemInstruction(ragContext) {
  const baseInstructions = `You are a friendly assistant on Sanket Bhujbal's portfolio website. \
Your job is to answer visitor questions about Sanket's background, education, skills, projects, \
experience, and certifications.

Rules:
- Answer ONLY using the portfolio context provided below.
- Do NOT invent, assume, or fabricate any facts about Sanket.
- If the requested information is not present in the context, say clearly: \
"I don't have that information in Sanket's portfolio."
- Sanket is male. Always refer to him using he/him pronouns (he, him, his).
- Keep answers concise (2–4 sentences), conversational, and in third person.
- If asked something completely unrelated to Sanket's portfolio, politely redirect \
the visitor to ask about his skills, projects, or experience instead.
- Do not mention RAG, vector stores, embeddings, or internal implementation details.`;

  if (!ragContext || ragContext.trim().length === 0) {
    return (
      baseInstructions +
      "\n\nNo specific portfolio context was retrieved for this question. " +
      "If the visitor asks about Sanket's portfolio, let them know you don't have " +
      "that specific information available."
    );
  }

  return `${baseInstructions}\n\n${ragContext}`;
}

// ─── Main handler ────────────────────────────────────────────────

const chatWithBot = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    // 1. Validate input
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required and cannot be empty.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Chatbot error: GEMINI_API_KEY not configured.');
      return res.status(500).json({
        error: 'Failed to get a response. Please try again.',
      });
    }

    const trimmedMessage = message.trim();

    // 2. RAG retrieval — get relevant portfolio documents
    let ragContext = '';
    if (portfolioRagService.isReady()) {
      try {
        const docs = await portfolioRagService.retrieveRelevantDocuments(trimmedMessage);
        ragContext  = portfolioRagService.buildRagContext(docs);

        if (ragContext) {
          console.log(`[RAG] Retrieved ${docs.length} doc(s) for query: "${trimmedMessage.substring(0, 60)}"`);
        } else {
          console.log(`[RAG] No relevant docs above threshold for: "${trimmedMessage.substring(0, 60)}"`);
        }
      } catch (ragErr) {
        // RAG failure is non-fatal — fall through with empty context
        console.error('[RAG] Retrieval error:', ragErr.message);
      }
    } else {
      console.warn('[RAG] Service not ready — responding without portfolio context');
    }

    // 3. Build dynamic system instruction
    const systemInstruction = buildSystemInstruction(ragContext);

    // 4. Format conversation history for Gemini
    const formattedHistory = Array.isArray(conversationHistory)
      ? conversationHistory
          .filter(item => item && item.content && typeof item.content === 'string')
          .map(item => ({
            role:  item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.content }],
          }))
      : [];

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: trimmedMessage }] },
    ];

    // 5. Call Gemini, trying each candidate model in order
    let reply     = null;
    let lastError = null;

    for (const { name: modelName, thinking } of CANDIDATE_MODELS) {
      try {
        const endpoint =
          `https://generativelanguage.googleapis.com/v1beta/models/` +
          `${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const generationConfig = thinking
          ? { maxOutputTokens: 500, thinkingConfig: { thinkingBudget: 0 } }
          : { maxOutputTokens: 500 };

        const response = await fetch(endpoint, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig,
          }),
        });

        if (!response.ok) {
          let errorMsg = response.statusText;
          try {
            const errBody = await response.json();
            errorMsg = errBody?.error?.message || response.statusText;
          } catch { /* ignore parse error */ }
          console.error(`Gemini ${modelName} → ${response.status}: ${errorMsg}`);
          lastError = errorMsg;
          continue; // try next model
        }

        const data     = await response.json();
        const parts    = data?.candidates?.[0]?.content?.parts ?? [];
        const textPart = parts.find(p => p.text && !p.thought) ?? parts[0];

        if (textPart?.text) {
          reply = textPart.text;
          break;
        }
      } catch (fetchErr) {
        console.error(`Gemini ${modelName} fetch error:`, fetchErr.message);
        lastError = fetchErr.message;
      }
    }

    if (!reply) {
      console.error('All Gemini models failed. Last error:', lastError);
      return res.status(500).json({
        error: 'Failed to get a response. Please try again.',
      });
    }

    return res.json({ reply });

  } catch (error) {
    console.error('Chatbot handler error:', error?.message ?? 'Unexpected error');
    return res.status(500).json({
      error: 'Failed to get a response. Please try again.',
    });
  }
};

module.exports = { chatWithBot, handleChat: chatWithBot };
