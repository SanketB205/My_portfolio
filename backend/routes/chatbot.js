'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { chatWithBot } = require('../controllers/chatbotController');

// Rate limiting: 15 requests per 10 minutes per IP.
// handler() is used instead of message so that CORS headers (already set by
// the global cors() middleware) are preserved on 429 responses — without
// this, express-rate-limit's default response path bypasses the middleware
// stack and the browser sees a CORS error instead of a rate-limit error.
const chatbotLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many messages. Please wait a bit before trying again.',
    });
  },
});

// Handle OPTIONS preflight explicitly so the rate limiter never intercepts it.
router.options('/', (req, res) => res.sendStatus(204));

// POST /api/chatbot
router.post('/', chatbotLimiter, chatWithBot);

module.exports = router;
