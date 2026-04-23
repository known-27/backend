const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const registrationRoutes = require('./routes/registration.routes');
const errorHandler = require('./middleware/errorHandler');

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
  max: 10000,                  // 500 requests per window per device IP (kiosk event traffic)
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
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    skip: (req, res) => req.originalUrl === '/ping' || req.originalUrl === '/health'
  }));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Ping (cron-job keep-alive) ───────────────────────────────────────────────
let _pingCount = 0;
let _lastPinged = null;

app.get('/ping', (req, res) => {
  _pingCount++;
  _lastPinged = new Date();

  const startedAt  = new Date(Date.now() - process.uptime() * 1000);
  const uptimeSec  = Math.floor(process.uptime());
  const uptimeStr  = `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="refresh" content="30" />
  <title>ASICS Backend — Ping Status</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #e0e0e0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #13131a; border: 1px solid #2a2a3a; border-radius: 16px; padding: 40px 48px; max-width: 480px; width: 100%; box-shadow: 0 8px 40px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 8px; background: #0d2e1a; border: 1px solid #1a5c33; color: #4ade80; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 999px; margin-bottom: 24px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; animation: pulse 1.6s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
    h1 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .sub { font-size: 13px; color: #666; margin-bottom: 32px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #1e1e2a; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .label { color: #888; }
    .value { color: #fff; font-weight: 600; text-align: right; }
    .value.green { color: #4ade80; }
    .footer { margin-top: 28px; font-size: 12px; color: #444; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> SERVER ALIVE</div>
    <h1>ASICS Registration Backend</h1>
    <p class="sub">Ping endpoint — refreshes every 30 s</p>
    <div class="row"><span class="label">Status</span><span class="value green">✓ Online</span></div>
    <div class="row"><span class="label">Last Pinged</span><span class="value">${_lastPinged.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></div>
    <div class="row"><span class="label">Total Pings</span><span class="value">${_pingCount}</span></div>
    <div class="row"><span class="label">Server Uptime</span><span class="value">${uptimeStr}</span></div>
    <div class="row"><span class="label">Started At</span><span class="value">${startedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></div>
    <div class="row"><span class="label">Environment</span><span class="value">${process.env.NODE_ENV || 'development'}</span></div>
    <p class="footer">Ping this URL every 5–10 min via cron-job.org to keep Render alive.</p>
  </div>
</body>
</html>`);
});

// ─── API Root Info ────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ASICS Registration API',
    version: '1.0.0',
    endpoints: {
      health: 'GET  /health',
      list: 'GET  /api/registrations?page=1&limit=20',
      create: 'POST /api/registrations',
      getById: 'GET  /api/registrations/:id',
      delete: 'DELETE /api/registrations/:id',
      exportExcel: 'GET  /api/registrations/export/excel',
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
