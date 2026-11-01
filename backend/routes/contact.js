const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const Contact = require('../models/Contact');
const mailService = require('../services/mailService');
const authMiddleware = require('../middleware/auth');

const MAX_NAME = 100;
const MAX_EMAIL = 200;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public form is unauthenticated and unmetered by default, which turns it
// into a free mail-relay / DB-fill vector. Cap submissions per IP.
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many messages sent. Please try again later.' }
});

// GET all contact messages (protected route)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Error fetching contact messages' });
  }
});

// CREATE new contact message (public route)
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const cleanName    = typeof name    === 'string' ? name.trim()    : '';
    const cleanEmail   = typeof email   === 'string' ? email.trim()    : '';
    const cleanSubject = typeof subject === 'string' ? subject.trim()  : '';
    const cleanMessage = typeof message === 'string' ? message.trim()  : '';

    if (!cleanName || !cleanEmail || !cleanMessage) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (cleanName.length > MAX_NAME) {
      return res.status(400).json({ message: `Name must be under ${MAX_NAME} characters` });
    }
    if (cleanEmail.length > MAX_EMAIL) {
      return res.status(400).json({ message: 'Email address is too long' });
    }
    if (cleanSubject.length > MAX_SUBJECT) {
      return res.status(400).json({ message: `Subject must be under ${MAX_SUBJECT} characters` });
    }
    if (cleanMessage.length > MAX_MESSAGE) {
      return res.status(400).json({ message: `Message must be under ${MAX_MESSAGE} characters` });
    }

    const contact = new Contact({
      name:    cleanName,
      email:   cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      read:    false
    });

    await contact.save();

    // Persisted first, so a mail failure never loses the submission.
    // sendContactNotification() swallows its own errors and reports status.
    const mail = await mailService.sendContactNotification(contact);
    if (mail.sent) {
      console.log(`📧 Contact notification sent for "${cleanName}" <${cleanEmail}>`);
    } else {
      console.warn(`⚠  Contact saved but notification not sent (${cleanEmail}): ${mail.error}`);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      notified: mail.sent
    });
  } catch (error) {
    console.error('Error creating contact message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Mark message as read (protected route)
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Message not found' });
    }

    contact.read = true;
    await contact.save();
    
    res.json(contact);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Error updating message' });
  }
});

// DELETE contact message (protected route)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

module.exports = router;
