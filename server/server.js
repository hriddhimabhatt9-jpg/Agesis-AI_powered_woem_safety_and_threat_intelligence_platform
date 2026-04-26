import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/index.js';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { setupSocket } from './sockets/index.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import aiRoutes from './routes/ai.js';
import alertRoutes from './routes/alerts.js';
import evidenceRoutes from './routes/evidence.js';
import reportRoutes from './routes/reports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: config.clientUrl, methods: ['GET', 'POST'], credentials: true },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Socket.IO
setupSocket(io);

// Serve static frontend in production
if (config.nodeEnv === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    } else {
      notFound(req, res, () => {});
    }
  });
} else {
  app.use(notFound);
}

app.use(errorHandler);

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 AEGESIS Server running on port ${PORT}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Client URL: ${config.clientUrl}\n`);
});

export default app;
