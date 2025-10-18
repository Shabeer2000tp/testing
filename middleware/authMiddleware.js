// middleware/authMiddleware.js

exports.isLoggedIn = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        // If the user is not logged in, redirect to the login page
        return res.redirect('/login');
    }
    // If the user is logged in, proceed to the next function/middleware
    next();
};

exports.isAdmin = (req, res, next) => {
    // First, check if the user is logged in at all
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    // Next, check if the logged-in user has the 'admin' role
    if (req.session.user.role !== 'admin') {
        // If they are not an admin, send a 'Forbidden' error
        return res.status(403).send('Access Denied: You are not an admin.');
    }
    // If they are a logged-in admin, proceed
    next();
};