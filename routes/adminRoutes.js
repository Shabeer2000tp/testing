const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');
const { uploadAttachment } = require('../config/multer-config');

// Dashboard & User Approval
router.get('/dashboard', isAdmin, adminController.getDashboard);
router.post('/users/:id/approve', isAdmin, adminController.approveUser);
router.post('/users/:id/reject', isAdmin, adminController.rejectUser);

// Team Management
router.get('/teams/new', isAdmin, adminController.getCreateTeamPage);
router.post('/teams', isAdmin, adminController.postCreateTeam);
router.get('/teams', isAdmin, adminController.getTeamsListPage);
router.get('/teams/:id', isAdmin, adminController.getTeamDetailPage);
router.get('/teams/:id/edit', isAdmin, adminController.getEditTeamPage);
router.post('/teams/:id/update', isAdmin, adminController.updateTeam);
router.post('/teams/:id/delete', isAdmin, adminController.deleteTeam);
router.get('/teams/:id/backlog', isAdmin, adminController.getTeamBacklog);
router.get('/teams/:id/report', isAdmin, adminController.getEvaluationReport);

// Proposal Management
router.get('/proposals', isAdmin, adminController.getProposalsPage);
router.post('/proposals/:id/approve', isAdmin, adminController.approveProposal);
router.post('/proposals/:id/reject', isAdmin, adminController.rejectProposal);

// Analytics
router.get('/analytics', isAdmin, adminController.getAnalyticsPage);

// Settings
router.get('/settings', isAdmin, adminController.getSettingsPage);
router.post('/settings', isAdmin, adminController.updateSetting);

// Reminder Management
router.get('/reminders', isAdmin, adminController.getRemindersPage);
router.post('/reminders', isAdmin, adminController.postCreateReminder);
router.post('/reminders/:id/delete', isAdmin, adminController.postDeleteReminder);

// Review Management
router.get('/reviews', isAdmin, adminController.getReviewsPage);
router.post('/reviews', isAdmin, adminController.postCreateReview);
router.get('/reviews/:id', isAdmin, adminController.getReviewDetailPage);
router.post('/reviews/:id/delete', isAdmin, adminController.postDeleteReview);

// Notification Routes
router.get('/notifications/new', isAdmin, adminController.getNotificationPage);
router.post('/notifications', isAdmin, uploadAttachment.single('attachment'), adminController.postSendNotification);
router.get('/notifications/log', isAdmin, adminController.getNotificationLogPage);
router.post('/notifications/:id/resend', isAdmin, adminController.postResendNotification);

// Debug: risk calculation details (admin-only)
router.get('/debug/risk', isAdmin, adminController.getRiskDebug);

module.exports = router;