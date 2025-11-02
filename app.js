// ---------------------------------------------------
// Import required packages
// ---------------------------------------------------
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
require('dotenv').config();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// ---------------------------------------------------
// Import Models & Routes
// ---------------------------------------------------
const Sprint = require('./models/Sprint');
const Team = require('./models/Team');
const Task = require('./models/Task');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const guideRoutes = require('./routes/guideRoutes');
const sprintRoutes = require('./routes/sprintRoutes');
const domainRoutes = require('./routes/domainRoutes');
const deliverableRoutes = require('./routes/deliverableRoutes');
const { loadUnreadNotifications } = require('./middleware/notificationMiddleware');

// ---------------------------------------------------
// Initialize Express and HTTP Server
// ---------------------------------------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ---------------------------------------------------
// Database Connection (Optimized)
// ---------------------------------------------------
mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
  maxPoolSize: 10, // limits open connections
  minPoolSize: 3,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  family: 4, // IPv4 only (avoids IPv6 lookup delay)
})
  .then(() => console.log('✅ MongoDB connected successfully.'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

if (!process.env.MONGODB_URI && !process.env.DATABASE_URL) {
  console.warn('⚠️ Warning: No MongoDB connection string found in environment variables!');
}

// ---------------------------------------------------
// Middleware Setup
// ---------------------------------------------------
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'partials/_layout');

// ---------------------------------------------------
// Static Assets (Cache for 1 day)
// ---------------------------------------------------
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true,
}));

// ---------------------------------------------------
// Session Middleware (Optimized)
// ---------------------------------------------------
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 6, // 6 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || process.env.DATABASE_URL,
    ttl: 60 * 60 * 6, // 6 hours
    autoRemove: 'native',
  }),
});

app.use(sessionMiddleware);

// Socket.IO sessions
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// ---------------------------------------------------
// Flash Messages & Global Variables
// ---------------------------------------------------
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.user = req.session.user || null;
  req.io = io;
  next();
});

app.use(loadUnreadNotifications);

// ---------------------------------------------------
// Socket.IO Logic (Optimized)
// ---------------------------------------------------
io.on('connection', (socket) => {
  const user = socket.request.session.user;
  if (user?.loginId) {
    socket.join(user.loginId.toString());
  }

  socket.on('disconnect', () => {
    // optional logging
  });
});

// ---------------------------------------------------
// Performance + Logging Middlewares
// ---------------------------------------------------
app.use(compression());

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // for Render or proxy hosts
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ---------------------------------------------------
// Health & Root Routes
// ---------------------------------------------------
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: '🔥 Sprint Sync server is healthy!' });
});

app.get('/', (req, res) => {
  res.render('landing', { title: 'Welcome to Sprint Sync' });
});

// ---------------------------------------------------
// Routes
// ---------------------------------------------------
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/student', studentRoutes);
app.use('/guide', guideRoutes);
app.use('/admin/sprints', sprintRoutes);
app.use('/admin/domains', domainRoutes);
app.use('/deliverables', deliverableRoutes);

// ---------------------------------------------------
// Scheduled Tasks (Cron Jobs)
// ---------------------------------------------------
cron.schedule('0 0 * * *', async () => {
  console.log('⏰ Daily maintenance task executed.');
  // Example: clear old logs, optimize collections, etc.
});

// ---------------------------------------------------
// Global Error Handler
// ---------------------------------------------------
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ---------------------------------------------------
// Graceful Shutdown Handler
// ---------------------------------------------------
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

// ---------------------------------------------------
// Start Server
// ---------------------------------------------------
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
