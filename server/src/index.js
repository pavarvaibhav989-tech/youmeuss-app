import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initDb, closeDb } from './db/index.js';
import { initializeSockets } from './sockets/index.js';
import { startCleanupSchedule } from './jobs/cleanup.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import videoRoutes from './routes/videos.js';
import messageRoutes from './routes/messages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'videos');
fs.mkdirSync(uploadsDir, { recursive: true });

// ─── Rate Limiters ────────────────────────────────────────

// Strict limiter for auth endpoints — prevents brute force & spam registration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                     // 10 attempts per IP per window
  standardHeaders: true,       // Return Retry-After header
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  skip: (req) => process.env.NODE_ENV === 'development', // No limit in dev
});

// General API limiter — prevents abuse of other endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 200,                    // 200 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
  skip: (req) => process.env.NODE_ENV === 'development',
});

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files with CORS headers so the browser can load videos
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
  res.setHeader('Accept-Ranges', 'bytes');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// ─── Routes ──────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);   // Strict: 10/15min
app.use('/api/rooms', apiLimiter, roomRoutes);   // Moderate: 200/15min
app.use('/api/videos', apiLimiter, videoRoutes);
app.use('/api/rooms', apiLimiter, messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Socket.io ───────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e8,
});

initializeSockets(io);

// ─── Start Server ────────────────────────────────────────
async function start() {
  await initDb();

  // Start background job: clean up rooms inactive for > 7 days
  startCleanupSchedule();

  httpServer.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║   🎬 YouMeUss Server Running            ║
  ║   Port: ${PORT}                            ║
  ║   Client: ${CLIENT_URL}       ║
  ╚══════════════════════════════════════════╝
    `);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});
