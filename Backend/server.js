require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Message = require('./models/Message');
const { buildConversationId } = require('./controllers/messageController');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// ─── Observability & Metrics ───────────────────────────────────────────────────
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { register, metricsMiddleware, metrics } = require('./utils/metrics');

// ─── Connect Database ──────────────────────────────────────────────────────────
connectDB();

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Online users map: userId -> socketId
const onlineUsers = new Map();

// Socket.io auth middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('User not found'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  onlineUsers.set(userId, socket.id);
  metrics.socketActiveConnections.set(onlineUsers.size);

  logger.info(`🟢 Socket connected: ${socket.user.name} (${userId})`, {
    userId,
    activeConnections: onlineUsers.size,
  });

  // Broadcast updated online users to everyone
  io.emit('online_users', Array.from(onlineUsers.keys()));

  // ── Private message ────────────────────────────────────────────────────────
  socket.on('send_message', async (data) => {
    try {
      const { receiverId, text } = data;
      if (!receiverId || !text) return;

      const conversationId = buildConversationId(userId, receiverId);

      const message = await Message.create({
        conversationId,
        sender: socket.user._id,
        receiver: receiverId,
        text,
      });

      const populated = await Message.findById(message._id)
        .populate('sender', 'name avatar')
        .populate('receiver', 'name avatar');

      // Track metric
      metrics.socketMessagesTotal.inc();

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', populated);
      }

      // Echo back to sender
      socket.emit('message_sent', populated);
    } catch (err) {
      logger.error('Failed to send message via socket:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ── Typing indicator ───────────────────────────────────────────────────────
  socket.on('typing', (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', { senderId: userId });
    }
  });

  socket.on('stop_typing', (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('stop_typing', { senderId: userId });
    }
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    metrics.socketActiveConnections.set(onlineUsers.size);
    io.emit('online_users', Array.from(onlineUsers.keys()));
    logger.info(`🔴 Socket disconnected: ${socket.user.name}`, {
      userId,
      activeConnections: onlineUsers.size,
    });
  });
});

// ─── Global Observability & HTTP Middlewares ──────────────────────────────────
app.use(requestLogger);
app.use(metricsMiddleware);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Prometheus Metrics Endpoint ──────────────────────────────────────────────
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    logger.error('Error rendering metrics for scraper:', err);
    res.status(500).end(err.message);
  }
});

// ─── SRE Health & Readiness Probes ────────────────────────────────────────────
// 1. Comprehensive System Health Overview
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    service: 'devcollab-backend',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      readyState: mongoose.connection.readyState,
    },
    memory: {
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    activeSockets: onlineUsers.size,
  });
});

// 2. Liveness probe (Kubernetes / ECS / Docker container liveness)
app.get('/api/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// 3. Readiness probe (Is DB ready to accept queries?)
app.get('/api/health/ready', (req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  if (isReady) {
    return res.status(200).json({ status: 'ready', database: 'connected' });
  }
  return res.status(503).json({ status: 'not_ready', database: 'disconnected' });
});

// ─── Application API Routes ───────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled Application Error:', {
    message: err.message,
    stack: err.stack,
    requestId: req.requestId,
  });
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 DevCollab Server running on port ${PORT}`);
  logger.info(`📡 Socket.io enabled`);
  logger.info(`📊 Prometheus metrics exposed at http://localhost:${PORT}/metrics`);
  logger.info(`🌐 CORS allowed from: ${process.env.CLIENT_URL}`);
});
