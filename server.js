require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "maps.googleapis.com"],
      imgSrc: ["'self'", "data:", "*.googleapis.com", "*.gstatic.com"],
      frameSrc: ["'self'", "https://www.google.com"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many submissions. Please try again later.' }
});

// Static files (served from the project root — this project has no /public subfolder)
app.use(express.static(__dirname));

// Routes
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
app.use('/api/contact', contactLimiter, contactRoutes);
app.use('/admin', adminRoutes);

// Page routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/services', (req, res) => res.sendFile(path.join(__dirname, 'services.html')));
app.get('/projects', (req, res) => res.sendFile(path.join(__dirname, 'projects.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));

// 404 (no 404.html on disk yet — plain response so this route can't itself 404)
app.use((req, res) => {
  res.status(404).send('Page not found.');
});

// MongoDB connection (optional - gracefully handle if not available)
try {
  const mongoose = require('mongoose');
  if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log('MongoDB connected'))
      .catch(err => console.log('MongoDB not available, using file storage fallback'));
  }
} catch(e) {}

app.listen(PORT, () => {
  console.log(`Jofinitycore Systems website running on http://localhost:${PORT}`);
});

module.exports = app;