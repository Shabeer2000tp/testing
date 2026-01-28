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
router.post('/teams/:id/backlog', isLoggedIn, guideController.postCreateBacklogItem);
router.post('/teams/:id/backlog/add-to-sprint', isLoggedIn, guideController.postCreateBacklogItemAndSprintTask);
router.post('/teams/:id/backlog/:itemId/edit', isLoggedIn, guideController.postEditBacklogItem);
router.post('/teams/:id/backlog/:itemId/delete', isLoggedIn, guideController.postDeleteBacklogItem);
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

router.post('/teams/:id/task-permission', isLoggedIn, guideController.setTaskPermission);
router.post('/teams/:id/permissions', isLoggedIn, guideController.setTaskPermission);

// Sprint and Task Management Routes
router.post('/teams/:id/sprint', isLoggedIn, guideController.postCreateSprint);
router.post('/teams/:id/tasks', isLoggedIn, guideController.postCreateTask);
router.post('/tasks/:taskId/edit', isLoggedIn, guideController.postEditTask);
router.post('/tasks/:id/delete', isLoggedIn, guideController.postDeleteTask);

router.get('/teams/:id/sprints', isLoggedIn, guideController.getSprintsPage);
router.post('/sprints/:sprintId/edit', isLoggedIn, guideController.postEditSprint);
router.post('/sprints/:sprintId/delete', isLoggedIn, guideController.postDeleteSprint);

module.exports = router;