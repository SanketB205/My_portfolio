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

// express-rate-limit keys on req.ip, which is wrong behind a proxy/load
// balancer unless trust proxy is set — all clients then collapse into one
// bucket. Set TRUST_PROXY=1 for a single reverse proxy in front of the app.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);
}

// ─── Middleware ───────────────────────────────────────────────────
// Allowed origins: Vercel frontend (set CORS_ORIGIN on Render), plus localhost for dev.
// CORS_ORIGIN can be a comma-separated list of origins.
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev server
  'http://localhost:3000',
  ...(process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : []),
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) and any vercel.app subdomain
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

// Respond to ALL preflight requests immediately after CORS middleware.
// This prevents rate-limiters or auth middleware from intercepting OPTIONS
// and stripping the CORS headers that cors() already set above.
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin || origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

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

// ─── Startup sequence ─────────────────────────────────────────────
// HTTP server starts immediately after MongoDB so Render health-checks
// pass during the slow embedding model download.
async function startServer() {
  try {
    // 1. MongoDB — must succeed before we accept requests
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected —', mongoose.connection.name);

    // 2. Start HTTP server right away so Render health-checks pass
    //    and all non-chatbot routes (projects, skills, auth …) are live.
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // 3. Embedding model — slow on first run (~25 MB download)
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
      const ragOk = await portfolioRagService.initialize();
      if (!ragOk) {
        console.warn('⚠  RAG service failed — chatbot will run without portfolio context');
      }
    }

    // 6. Auto-seed vector store from MongoDB if empty.
    //    Render’s filesystem is ephemeral: the index.json is wiped on every
    //    redeploy/restart, so documentCount is always 0 on a fresh boot.
    //    We re-build it automatically so the chatbot has portfolio context
    //    without any manual intervention.
    if (embOk && vsOk) {
      try {
        const { indexPortfolioDocuments } = require('./services/portfolioIndexer');
        const storeStats = await vectorStore.getStats();

        if (storeStats.documentCount === 0) {
          console.log('🔄 Vector store is empty — auto-seeding from MongoDB...');
          const result = await indexPortfolioDocuments();
          console.log(`✅ Auto-seed complete — ${result.indexed}/${result.totalDocuments} documents indexed`);
        } else {
          console.log(`ℹ️  Vector store already has ${storeStats.documentCount} document(s) — skipping auto-seed`);
        }
      } catch (seedErr) {
        // Non-fatal: chatbot works without RAG context
        console.error('⚠  Auto-seed failed (chatbot will run without RAG context):', seedErr.message);
      }
    }

  } catch (err) {
    console.error('❌ Server startup failed:', err.message);
    process.exit(1);
  }
}

startServer();
