const Notification = require('../models/Notification');

const loadUnreadNotifications = async (req, res, next) => {
    // We only fetch notifications if a user is logged in and in a session
    if (req.session && req.session.user && req.session.user.loginId) {
        try {
            // Find all notifications for the current user that are not read
            const unreadNotifications = await Notification.find({
                recipient: req.session.user.loginId, // Use loginId which is the reference in Notification model
                isRead: false
            }).sort({ createdAt: -1 }); // Sort by newest first

            // Make the notifications available to all templates via res.locals
            res.locals.unreadNotifications = unreadNotifications;
        } catch (error) {
            console.error('Error loading unread notifications for view:', error);
            res.locals.unreadNotifications = []; // Ensure it's an empty array on error
        }
    } else {
        // If no user is logged in, provide an empty array
        res.locals.unreadNotifications = [];
    }
    next(); // Proceed to the next middleware or route handler
};

module.exports = { loadUnreadNotifications };
