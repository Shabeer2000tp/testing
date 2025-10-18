const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const guideController = require('../controllers/guideController');

// CORRECT: Keep only this single route definition for the dashboard
router.get('/dashboard', isLoggedIn, guideController.getDashboard);
router.get('/teams/:id', isLoggedIn, guideController.getTeamDetailPage);
// @route   GET /guide/teams/:id/backlog
// @desc    View the backlog for an assigned team
router.get('/teams/:id/backlog', isLoggedIn, guideController.getTeamBacklog);
// @route   GET /guide/proposals
// @desc    View and manage proposals for assigned teams
router.get('/proposals', isLoggedIn, guideController.getProposalsPage);

// Guide approves a proposal
router.post('/proposals/:id/approve', isLoggedIn, guideController.approveProposal);

// --- ADD THIS ROUTE ---
// Guide rejects a proposal
router.post('/proposals/:id/reject', isLoggedIn, guideController.rejectProposal);
// @route   POST /guide/logs/:id/feedback
// @desc    Add feedback to a daily log
router.post('/logs/:id/feedback', isLoggedIn, guideController.addLogFeedback);
// ... other routes

// Route for the new full-screen calendar page for guides
router.get('/calendar', isLoggedIn, guideController.getCalendarPage);
// ... other routes

// Route for the guide to see their assigned reviews
router.get('/reviews', isLoggedIn, guideController.getReviewsPage);
// ADD THIS ROUTE to show the review detail page
router.get('/reviews/:id', isLoggedIn, guideController.getReviewDetailPage);

// ADD THIS ROUTE to handle the remark submission
router.post('/reviews/:id/remarks', isLoggedIn, guideController.postAddRemark);

// Notification routes
router.get('/notifications', isLoggedIn, guideController.getNotificationsPage);
router.get('/notifications/:id', isLoggedIn, guideController.getNotificationDetailPage);
router.post('/notifications/:id/read', isLoggedIn, guideController.postMarkNotificationAsRead);
router.post('/notifications/mark-all-read', isLoggedIn, guideController.postMarkAllRead);

module.exports = router;