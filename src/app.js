const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');

const registrationRoutes = require('./routes/registration.routes');
const errorHandler       = require('./middleware/errorHandler');

const app = express();

// ─── Trust Render.com's Proxy ─────────────────────────────────────────────────
// Render.com (and most cloud platforms) sit behind a reverse proxy that injects
// the X-Forwarded-For header. Setting trust proxy = 1 tells Express to trust
// the first hop, which fixes:
//   1. express-rate-limit ERR_ERL_UNEXPECTED_X_FORWARDED_FOR validation error
//   2. Rate limiting now works per-device IP instead of all devices sharing one counter
app.set('trust proxy', 1);

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGIN || '*'
      : '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,                  // 500 requests per window per device IP (kiosk event traffic)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});
app.use('/api', apiLimiter);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Root Info ────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ASICS Registration API',
    version: '1.0.0',
    endpoints: {
      health:        'GET  /health',
      list:          'GET  /api/registrations?page=1&limit=20',
      create:        'POST /api/registrations',
      getById:       'GET  /api/registrations/:id',
      delete:        'DELETE /api/registrations/:id',
      exportExcel:   'GET  /api/registrations/export/excel',
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/registrations', registrationRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
