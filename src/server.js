// ─── IMPORTANT: This must be at the very top before any network calls ─────────
// On Windows, Node.js uses a custom DNS resolver that cannot resolve SRV records.
// Setting ipv4first ensures consistent resolution with the OS DNS.
const { setDefaultResultOrder } = require('dns');
setDefaultResultOrder('ipv4first');
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀  Server running on port ${PORT}  [${process.env.NODE_ENV || 'development'}]`);
      console.log(`📋  API base: http://localhost:${PORT}/api/`);
      console.log(`❤️   Health:   http://localhost:${PORT}/health`);
    });

    // ─── Graceful Shutdown ──────────────────────────────────────────────────
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully…`);
      server.close(() => {
        console.log('✅  HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason) => {
      console.error('❌  Unhandled Rejection:', reason);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
