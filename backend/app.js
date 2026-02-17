require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const portfolioRoutes = require('./routes/portfolioRoutes');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const contactRoutes = require('./routes/contactRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Ensure uploads directory exists (used for local dev fallback)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();

// Middleware
app.use(
     helmet({
          contentSecurityPolicy: false,
          crossOriginEmbedderPolicy: false,
     })
);
app.use(
     cors({
          origin: process.env.CLIENT_URL || '*',
          methods: ['GET', 'POST', 'PATCH', 'DELETE'],
          credentials: true,
     })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Health-check
app.get('/api/health', (_req, res) => {
     res.json({ success: true, message: 'Portfolio API is running', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/uploads', uploadRoutes);

// Serve uploaded files (local fallback) - GridFS route will handle streamed files in controller
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve admin panel (static files)
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.get('/admin/{*splat}', (_req, res) => res.sendFile(path.join(__dirname, '..', 'admin', 'index.html')));

// Serve public portfolio files
app.use(express.static(path.join(__dirname, '..')));

// 404 handler
app.use((req, res) => {
     res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

module.exports = app;
