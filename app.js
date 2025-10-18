

// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
require('dotenv').config();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const http = require('http');
const { Server } = require("socket.io");

// Import Routes
const cron = require('node-cron');
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

// Initialize the Express app and HTTP server
const app = express();
const server = http.createServer(app); // Create server from Express app
const io = new Server(server);         // Attach Socket.IO to the server

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch((err) => console.error('MongoDB connection error:', err));

// View Engine & Static Files Setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('layout', 'partials/_layout'); // Set the default layout file
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// --- CORRECTED SESSION MIDDLEWARE SETUP ---
// 1. Define the session middleware as a constant
const sessionMiddleware = session({
    secret: 'a_long_random_secret_key_for_your_project',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    })
});

// 2. Use the constant for both Express and Socket.IO
app.use(sessionMiddleware);
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});
// --- END OF CORRECTION ---

app.use(flash());

// Global Variables Middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.user = req.session.user || null; // Make user available in all templates
    req.io = io; // Make io object available in all controllers
    next();
});

// Middleware to load unread notifications (should come after user is set in locals)
app.use(loadUnreadNotifications);

// Real-time connection logic
io.on('connection', (socket) => {
    console.log('A user connected via WebSocket');
    const user = socket.request.session.user;

    // Check for user and the correct loginId property
    if (user && user.loginId) {
        socket.join(user.loginId.toString()); // User joins a 'room' named after their own ID
        console.log(`User ${user.loginId} joined their notification room.`);
    }
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// --- ROUTES ---
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/student', studentRoutes);
app.use('/guide', guideRoutes);
app.use('/admin/sprints', sprintRoutes);
app.use('/admin/domains', domainRoutes);
app.use('/deliverables', deliverableRoutes);

// --- SCHEDULED TASKS (CRON JOB) ---
cron.schedule('1 0 * * *', async () => { /* ... your existing cron job logic ... */ });

// --- CORRECTED SERVER START ---
const PORT = process.env.PORT || 8080;
// Use server.listen() to ensure Socket.IO works
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // console.log(`Server is running on http://10.158.254.42:${PORT}`);
});