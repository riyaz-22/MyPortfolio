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

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ─── Connect to MongoDB ────────────────────────────────────────
connectDB();

// ─── Initialise Express ────────────────────────────────────────
const app = express();

// ─── Global Middleware ─────────────────────────────────────────
app.use(
     helmet({
          contentSecurityPolicy: false,   // admin panel uses inline styles/scripts
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

if (process.env.NODE_ENV === 'development') {
     app.use(morgan('dev'));
}

// ─── Health-check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
     res.json({
          success: true,
          message: 'Portfolio API is running',
          timestamp: new Date().toISOString(),
     });
});

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/uploads', uploadRoutes);

// ─── Serve uploaded files ──────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Serve admin panel ─────────────────────────────────────────
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
// SPA-style fallback for /admin sub-routes (e.g. /admin/dashboard)
app.get('/admin/{*splat}', (_req, res) => {
     res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// ─── Serve public portfolio assets ─────────────────────────────
app.use(express.static(path.join(__dirname, '..')));

// ─── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
     res.status(404).json({
          success: false,
          message: `Route ${req.originalUrl} not found`,
     });
});

// ─── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
     console.log(
          `🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
     );
});

module.exports = app;
