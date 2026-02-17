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

// Defensive preflight/CORS middleware (runs before helmet and cors)
// This ensures OPTIONS preflight responses always include basic CORS headers
app.use((req, res, next) => {
     const allowed = [
          'https://riyaz-22.github.io',
          'https://my-portfolio-seven-iota-38.vercel.app',
     ];
     if (process.env.CLIENT_URL) {
          try {
               allowed.push(new URL(process.env.CLIENT_URL).origin);
          } catch (e) {
               allowed.push(process.env.CLIENT_URL.replace(/\/+$/, ''));
          }
     }

     const origin = req.headers.origin;
     if (origin && allowed.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
     }

     if (req.method === 'OPTIONS') return res.sendStatus(204);
     next();
});

// Middleware
app.use(
     helmet({
          contentSecurityPolicy: false,
          crossOriginEmbedderPolicy: false,
          // Allow resources (images/files) to be loaded from other origins
          // when the frontend is hosted separately (GitHub Pages).
          crossOriginResourcePolicy: { policy: 'cross-origin' },
     })
);
// Configure CORS: allow specific origins and keep credentials support
const allowedOrigins = [
     'https://riyaz-22.github.io/MyPortfolio',
     'https://my-portfolio-seven-iota-38.vercel.app',
];

if (process.env.CLIENT_URL) {
     try {
          allowedOrigins.push(new URL(process.env.CLIENT_URL).origin);
     } catch (e) {
          allowedOrigins.push(process.env.CLIENT_URL.replace(/\/+$/, ''));
     }
}

const corsOptions = {
     origin: (origin, callback) => {
          // Allow server-to-server or same-origin requests with no origin
          if (!origin) return callback(null, true);
          try {
               const incoming = new URL(origin).origin;
               if (allowedOrigins.includes(incoming)) return callback(null, true);
          } catch (e) {
               if (allowedOrigins.includes(origin)) return callback(null, true);
          }
          return callback(new Error('CORS policy: origin not allowed'), false);
     },
     methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
     credentials: true,
     optionsSuccessStatus: 204,
     preflightContinue: false,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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
