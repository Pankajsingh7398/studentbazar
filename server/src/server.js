import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env and .env.local from server directory or root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import app from './app.js';
import { connectDB } from './config/database.js';
import { validateEnvironment } from './config/envValidate.js';

// Pre-flight environment validation
validateEnvironment();

const PORT = process.env.PORT || 5001;

let server;

// Connect to MongoDB and boot server
connectDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`🎓 StudentBazaar API Server is actively running!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🩺 Health: http://localhost:${PORT}/api/v1/health`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`==================================================\n`);
    });
  })
  .catch((err) => {
    console.error('[Boot Error] Failed to initialize server:', err);
    process.exit(1);
  });

// Graceful shutdown handling
const shutdown = () => {
  console.log('\n[Shutdown] Received termination signal. Closing HTTP server gracefully...');
  if (server) {
    server.close(() => {
      console.log('[Shutdown] HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection] at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception] thrown:', err);
  process.exit(1);
});
