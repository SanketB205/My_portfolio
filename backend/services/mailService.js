'use strict';

/**
 * Mail Service — outbound email via SMTP (nodemailer)
 *
 * Used by POST /api/contact to notify the site owner that a visitor
 * submitted the contact form.
 *
 * Gmail requires an App Password rather than the account password:
 *   https://myaccount.google.com/apppasswords
 * That value goes in SMTP_PASS. SMTP_HOST / SMTP_PORT / SMTP_USER /
 * SMTP_TO all have working Gmail defaults, so a fresh clone only needs
 * SMTP_PASS set.
 *
 * Failure policy: sendContactNotification() never throws. The contact
 * submission is already persisted to MongoDB before mail is attempted,
 * so a mail outage must not fail the visitor's request. The return
 * value reports what happened so the caller can log it.
 */

const nodemailer = require('nodemailer');

const GMAIL_DEFAULTS = {
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '465',
  SMTP_SECURE: 'true'
};

class MailService {
  constructor() {
    this._transport = null;
    this._from = process.env.SMTP_FROM || process.env.SMTP_USER || '';
    this._to   = process.env.SMTP_TO   || process.env.ADMIN_EMAIL || '';
  }

  get configured() {
    return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS && this._to);
  }

  _getTransport() {
    if (this._transport) return this._transport;

    this._transport = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || GMAIL_DEFAULTS.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || GMAIL_DEFAULTS.SMTP_PORT, 10),
      secure: String(
        process.env.SMTP_SECURE ?? GMAIL_DEFAULTS.SMTP_SECURE
      ) === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    return this._transport;
  }

  /**
   * Send a plain-text + HTML email. Resolves to { sent, error }.
   * Never rejects.
   */
  async send({ to, subject, text, html, replyTo }) {
    if (!this.configured) {
      const error = 'SMTP is not configured — set SMTP_USER, SMTP_PASS and SMTP_TO';
      console.warn('⚠  Mail not sent:', error);
      return { sent: false, error };
    }

    try {
      const info = await this._getTransport().sendMail({
        from:    process.env.SMTP_FROM || `"Portfolio" <${process.env.SMTP_USER}>`,
        to:      to || this._to,
        subject,
        text,
        html,
        ...(replyTo ? { replyTo } : {})
      });
      return { sent: true, messageId: info.messageId };
    } catch (err) {
      console.error('Failed to send email:', err.message);
      return { sent: false, error: err.message };
    }
  }

  /**
   * Notify the site owner of a new contact form submission.
   * `contact` is the persisted Contact document.
   */
  async sendContactNotification(contact) {
    const name    = String(contact.name    || '').trim();
    const email   = String(contact.email   || '').trim();
    const subject = String(contact.subject || '').trim();
    const message = String(contact.message || '').trim();

    const lines = [
      'New message from your portfolio contact form.',
      '',
      `Name:    ${name}`,
      `Email:   ${email}`,
      `Subject: ${subject || '(none)'}`,
      '',
      'Message:',
      message
    ];

    const safe = (v) =>
      String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;

    return this.send({
      subject: subject
        ? `[Portfolio] ${subject} — ${name}`
        : `[Portfolio] New message from ${name}`,
      text: lines.join('\n'),
      html:
        '<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6">' +
        '<p><strong>New message from your portfolio contact form.</strong></p>' +
        '<table cellpadding="6" cellspacing="0" style="border-collapse:collapse">' +
        `<tr><td style="color:#666">Name</td><td><strong>${safe(name)}</strong></td></tr>` +
        `<tr><td style="color:#666">Email</td><td><a href="mailto:${safe(email)}">${safe(email)}</a></td></tr>` +
        `<tr><td style="color:#666">Subject</td><td>${safe(subject || '(none)')}</td></tr>` +
        '</table>' +
        '<hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0" />' +
        `<div style="white-space:pre-wrap">${safe(message)}</div>` +
        '</div>',
      replyTo
    });
  }
}

module.exports = new MailService();
module.exports.MailService = MailService;
