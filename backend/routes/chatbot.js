const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { chatWithBot } = require('../controllers/chatbotController');

// Rate limiting: 15 requests per 10 minutes per IP
const chatbotLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // Limit each IP to 15 requests per windowMs
  message: {
    error: 'Too many messages. Please wait a bit before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/chatbot
router.post('/', chatbotLimiter, chatWithBot);

module.exports = router;
