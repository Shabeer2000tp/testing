const express = require('express');
const router = express.Router();
const domainController = require('../controllers/domainController');
const { isAdmin } = require('../middleware/authMiddleware');

router.get('/', isAdmin, domainController.getDomainsPage);
router.post('/', isAdmin, domainController.createDomain);

module.exports = router;