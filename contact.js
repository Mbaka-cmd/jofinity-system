const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Validation rules
const validateContact = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('service').optional().trim(),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 })
];

// Save to JSON file as fallback when MongoDB not available
function saveToFile(data) {
  const filePath = path.join(__dirname, '../data/messages.json');
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  let messages = [];
  try {
    if (fs.existsSync(filePath)) {
      messages = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch(e) {}
  
  messages.push({ ...data, id: Date.now(), createdAt: new Date().toISOString(), status: 'new' });
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
}

// Send email notification
async function sendEmailNotification(data) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Jofinitycore Website" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
    subject: `New Contact Inquiry from ${data.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0a1628; color: white; padding: 20px; text-align: center;">
          <h1 style="margin:0; font-size: 22px;">Jofinitycore Systems Ltd</h1>
          <p style="margin:5px 0 0; color: #00d4ff;">New Website Inquiry</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border: 1px solid #e0e0e0;">
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding: 10px; font-weight: bold; color: #555; width: 120px;">Name:</td><td style="padding: 10px;">${data.name}</td></tr>
            <tr style="background:#fff"><td style="padding: 10px; font-weight: bold; color: #555;">Email:</td><td style="padding: 10px;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
            <tr><td style="padding: 10px; font-weight: bold; color: #555;">Phone:</td><td style="padding: 10px;">${data.phone || 'Not provided'}</td></tr>
            <tr style="background:#fff"><td style="padding: 10px; font-weight: bold; color: #555;">Service:</td><td style="padding: 10px;">${data.service || 'General Inquiry'}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold; color: #555; vertical-align: top;">Message:</td><td style="padding: 10px;">${data.message}</td></tr>
          </table>
        </div>
        <div style="background: #0a1628; color: #aaa; padding: 15px; text-align: center; font-size: 12px;">
          Received: ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })} EAT
        </div>
      </div>
    `
  });
}

// POST /api/contact
router.post('/', validateContact, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, phone, service, message } = req.body;
  const contactData = { name, email, phone, service, message };

  try {
    // Try MongoDB first
    try {
      const Contact = require('../config/Contact');
      await Contact.create(contactData);
    } catch(dbErr) {
      // Fallback to file storage
      saveToFile(contactData);
    }

    // Send email notification (non-blocking)
    sendEmailNotification(contactData).catch(err => console.log('Email not sent:', err.message));

    res.json({
      success: true,
      message: 'Thank you! Your message has been received. We will contact you within 24 hours.'
    });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again or call us directly.' });
  }
});

module.exports = router;