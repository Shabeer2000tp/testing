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
// Database Connection (Render or Local)
// ---------------------------------------------------
mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('✅ MongoDB connected successfully.'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

if (!process.env.MONGODB_URI && !process.env.DATABASE_URL) {
  console.warn('⚠️ Warning: No MongoDB connection string found in environment variables!');
}

// ---------------------------------------------------
// Middleware Setup
// ---------------------------------------------------
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'partials/_layout');
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------
// Session Middleware
// ---------------------------------------------------
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || process.env.DATABASE_URL,
  }),
});

app.use(sessionMiddleware);

// Allow Socket.IO to share session
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
// Socket.IO Logic
// ---------------------------------------------------
io.on('connection', (socket) => {
  console.log('✅ A user connected via WebSocket');
  const user = socket.request.session.user;

  if (user && user.loginId) {
    socket.join(user.loginId.toString());
    console.log(`User ${user.loginId} joined their notification room.`);
  }

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

// ---------------------------------------------------
// Performance and Logging Middlewares
// ---------------------------------------------------
app.use(compression());

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined')); // For Render logs
} else {
  app.use(morgan('dev')); // For local logs
}

// ---------------------------------------------------
// Health + Root Routes
// ---------------------------------------------------
app.get('/health', (req, res) => {
  res.status(200).send('🔥 Sprint Sync server is healthy!');
});

// Landing page or redirect
app.get('/', (req, res) => {
  try {
    // Option 1: Render a landing page (views/landing.ejs)
    res.render('landing', { title: 'Welcome to Sprint Sync' });
    
    // Option 2 (replace above): redirect to login automatically
    // res.redirect('/login');
  } catch (err) {
    console.error('Landing page error:', err);
    res.status(500).send('Internal Server Error at root route');
  }
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
cron.schedule('1 0 * * *', async () => {
  console.log('⏰ Daily cron job executed');
});

// ---------------------------------------------------
// Error Handling Middleware
// ---------------------------------------------------
app.use((err, req, res, next) => {
  console.error('💥 Error:', err.stack);
  res.status(500).send('Internal Server Error');
});

// ---------------------------------------------------
// Start Server (Render Compatible)
// ---------------------------------------------------
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  if (process.env.NODE_ENV === 'production') {
    console.log(`🚀 Server running in production on port ${PORT}`);
  } else {
    console.log(`🚀 Server running locally at http://localhost:${PORT}`);
  }
});
