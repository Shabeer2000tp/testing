const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Import the controller

// @route   GET /
// @desc    Display the login form (if not logged in) or redirect to dashboard
router.get('/', authController.getLandingPage);

// @route   GET /login
// @desc    Display the login form
router.get('/login', authController.getLogin);

// @route   GET /register
// @desc    Display the registration form
router.get('/register', authController.getRegister); // Use the controller function

// @route   POST /register
// @desc    Handle the registration logic
router.post('/register', authController.postRegister); // Use the controller function

// @route   POST /login
// @desc    Handle the login logic
router.post('/login', authController.postLogin);

// @route   POST /logout
// @desc    Handle user logout
router.post('/logout', authController.postLogout);

module.exports = router;