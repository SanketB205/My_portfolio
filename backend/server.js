'use strict';

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');

dotenv.config();

// ─── Services (initialized after MongoDB connects) ───────────────
const embeddingService    = require('./services/embeddingService');
const vectorStore         = require('./services/chromaService');
const portfolioRagService = require('./services/portfolioRagService');

// ─── Routes ──────────────────────────────────────────────────────
const authRoutes          = require('./routes/auth');
const projectRoutes       = require('./routes/projects');
const skillRoutes         = require('./routes/skills');
const experienceRoutes    = require('./routes/experience');
const contactRoutes       = require('./routes/contact');
const resumeRoutes        = require('./routes/resume');
const profileImageRoutes  = require('./routes/profileImage');
const certificationRoutes = require('./routes/certifications');
const chatbotRoutes       = require('./routes/chatbot');
const vectorDBStatusRoutes = require('./routes/vectordb-status');

const app = express();

// ─── Proxy / rate-limit ──────────────────────────────────────────
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);
}

// ─── Middleware ───────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : []),
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use('/uploads', express.static('uploads'));

// ─── Route registration ───────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/projects',      projectRoutes);
app.use('/api/skills',        skillRoutes);
app.use('/api/experience',    experienceRoutes);
app.use('/api/contact',       contactRoutes);
app.use('/api/resume',        resumeRoutes);
app.use('/api/profile-image', profileImageRoutes);
app.use('/api/certifications',certificationRoutes);
app.use('/api/chatbot',       chatbotRoutes);
app.use('/api/vectordb',      vectorDBStatusRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ─── Memory helper ────────────────────────────────────────────────
function logMemory(label) {
  const m = process.memoryUsage();
  console.log(
    `[Memory] ${label}: ` +
    `RSS=${(m.rss / 1048576).toFixed(1)}MB ` +
    `Heap=${(m.heapUsed / 1048576).toFixed(1)}/${(m.heapTotal / 1048576).toFixed(1)}MB ` +
    `Ext=${(m.external / 1048576).toFixed(1)}MB`
  );
}

// ─── Startup sequence ─────────────────────────────────────────────
async function startServer() {
  try {
    logMemory('Startup');

    // 1. MongoDB — must succeed before we accept requests
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected —', mongoose.connection.name);

    // 2. Start HTTP server immediately so Render health-checks pass
    //    and all non-chatbot routes (projects, skills, auth …) are live.
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // 3. Embedding model — slow on first run (download + load)
    //    Non-fatal if it fails: chatbot will run without RAG context.
    logMemory('Before embedding model load');
    const embOk = await embeddingService.initialize();
    if (!embOk) {
      console.warn('⚠  Embedding service failed — chatbot will run without RAG');
    }

    // 4. Vectra vector store (file-based, no Docker)
    const vsOk = await vectorStore.initialize();
    if (!vsOk) {
      console.warn('⚠  Vector store failed — chatbot will run without RAG');
    }

    // 5. RAG service (depends on 3 + 4)
    if (embOk && vsOk) {
      await portfolioRagService.initialize();
    }

    // 6. Auto-seed vector store from MongoDB if empty.
    //    Render's filesystem is ephemeral: index.json is wiped on every
    //    redeploy/restart, so documentCount is always 0 on a fresh boot.
    //
    //    CRITICAL: this runs in the BACKGROUND (not awaited) so the process
    //    stays alive and serves health-checks even if indexing is slow.
    //    The chatbot will gracefully return "I don't have that information"
    //    until the index is populated, then start answering correctly.
    if (embOk && vsOk) {
      // Defer to next tick so the event loop can process pending requests
      setImmediate(async () => {
        try {
          const { indexPortfolioDocuments } = require('./services/portfolioIndexer');
          const storeStats = await vectorStore.getStats();

          if (storeStats.documentCount === 0) {
            console.log('🔄 Vector store is empty — auto-seeding from MongoDB (background)...');
            const result = await indexPortfolioDocuments();
            if (result.failed > 0) {
              console.error(`⚠  Auto-seed completed with ${result.failed} failure(s)`);
            } else {
              console.log(`✅ Auto-seed complete — ${result.indexed}/${result.totalDocuments} documents indexed`);
            }
          } else {
            console.log(`ℹ️  Vector store already has ${storeStats.documentCount} document(s) — skipping auto-seed`);
          }
        } catch (seedErr) {
          // Non-fatal: server stays up, chatbot runs without RAG context
          console.error('⚠  Auto-seed failed (chatbot will run without RAG context):', seedErr.message);
          logMemory('Auto-seed failure');
        }
      });
    }

  } catch (err) {
    console.error('❌ Server startup failed:', err.message);
    process.exit(1);
  }
}

startServer();
