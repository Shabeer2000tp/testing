const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { isLoggedIn } = require('../middleware/authMiddleware');
const { uploadDeliverable } = require('../config/multer-config'); // Correctly import the specific uploader
const notificationController = require('../controllers/notificationController');

// All routes use isLoggedIn for consistency
router.get('/dashboard', isLoggedIn, studentController.getDashboard);
router.post('/tasks', isLoggedIn, studentController.createTask);
router.post('/tasks/:id/status', isLoggedIn, studentController.updateTaskStatus);
router.post('/tasks/:id/move', isLoggedIn, studentController.moveTaskToCurrentSprint);
router.get('/backlog', isLoggedIn, studentController.getBacklogPage);
router.post('/backlog', isLoggedIn, studentController.createBacklogItem);
router.get('/backlog/:id/plan', isLoggedIn, studentController.getPlanTaskPage);
router.get('/sprint-planning', isLoggedIn, studentController.getSprintPlanningPage);
router.get('/past-sprints', isLoggedIn, studentController.getPastSprints);
router.get('/proposal', isLoggedIn, studentController.getProposalPage);
router.post('/proposal', isLoggedIn, studentController.submitProposal);
router.get('/proposal/edit', isLoggedIn, studentController.getEditProposalPage);
router.post('/proposal/update', isLoggedIn, studentController.updateProposal);
router.get('/daily-log', isLoggedIn, studentController.getDailyLogPage);
router.post('/daily-log', isLoggedIn, studentController.submitDailyLog);
router.get('/upload', isLoggedIn, studentController.getUploadPage);
// CORRECTED USAGE OF MULTER:
router.post('/upload', isLoggedIn, uploadDeliverable.single('file'), studentController.postUpload);
router.get('/sprints', isLoggedIn, studentController.getSprintsPage);
router.post('/sprints', isLoggedIn, studentController.createSprint);
router.get('/calendar', isLoggedIn, studentController.getCalendarPage);
router.get('/reviews', isLoggedIn, studentController.getReviewsPage);
router.get('/reviews/:id', isLoggedIn, studentController.getReviewDetailPage);
router.post('/notifications/:id/read', isLoggedIn, studentController.postMarkNotificationAsRead);

// Route to view a single notification's details
router.get('/notifications/:id', isLoggedIn, notificationController.getNotificationDetailPage);

// Routes for viewing notifications
router.get('/notifications', isLoggedIn, studentController.getNotificationsPage);
router.post('/notifications/mark-all-read', isLoggedIn, studentController.postMarkAllRead);

module.exports = router;