const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');
const Deliverable = require('../models/Deliverable');

// @route   GET /deliverables/download/:id
// @desc    Download a deliverable file
router.get('/download/:id', isLoggedIn, async (req, res) => {
    try {
        const deliverable = await Deliverable.findById(req.params.id);
        // In a real app, you'd add more checks here to ensure the user has permission
        res.download(deliverable.filePath, deliverable.fileName);
    } catch (error) {
        req.flash('error_msg', 'Could not download file.');
        res.redirect('back');
    }
});

module.exports = router;