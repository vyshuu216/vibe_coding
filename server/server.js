import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import chatRoutes from './routes/chatRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.) or matching client URL
      if (!origin || origin === CLIENT_URL || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/production with credentials allowed
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Accept'],
    exposedHeaders: ['Content-Disposition'],
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount Chat & Conversation API routes
app.use('/api', chatRoutes);

// Catch-all 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Server after connecting to MongoDB
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Server] AI Chat Assistant Backend listening on http://localhost:${PORT}`);
      console.log(`[Server] Real-time SSE streaming ready at http://localhost:${PORT}/api/chat/stream`);
    });
  } catch (error) {
    console.error('[Server] Critical failure during startup:', error);
    process.exit(1);
  }
}

startServer();

