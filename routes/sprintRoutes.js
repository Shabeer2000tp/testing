const express = require('express');
const router = express.Router();
const sprintController = require('../controllers/sprintController');
const { isAdmin } = require('../middleware/authMiddleware');

// All routes in this file are protected and for admins only
router.use(isAdmin);

router.get('/', sprintController.getSprintsPage);
router.post('/', sprintController.createSprint);
router.get('/:id/edit', sprintController.getEditSprintPage);
router.post('/:id/update', sprintController.updateSprint);
router.post('/:id/delete', sprintController.deleteSprint);
// @route   POST /sprints/:id/complete
// @desc    Complete a sprint and calculate velocity
router.post('/:id/complete', isAdmin, sprintController.completeSprint);

module.exports = router;