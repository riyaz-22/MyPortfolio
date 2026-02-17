require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const portfolioRoutes = require('./routes/portfolioRoutes');

// ─── Connect to MongoDB ────────────────────────────────────────
connectDB();

// ─── Initialise Express ────────────────────────────────────────
const app = express();

// ─── Global Middleware ─────────────────────────────────────────
app.use(helmet()); // security headers
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
app.use('/api/portfolio', portfolioRoutes);

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
