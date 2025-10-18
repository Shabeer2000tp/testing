const mongoose = require('mongoose');
const Notification = require('../models/Notification');

module.exports.getNotificationDetailPage = async (req, res) => {
    try {
        const id = req.params.id;

        // Validate incoming id to avoid Mongoose CastError when it's not a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            req.flash('error_msg', 'Invalid notification id.');
            return res.redirect('/student/notifications');
        }

        const notification = await Notification.findOne({
            _id: id,
            recipient: req.session.user.loginId
        });

        if (!notification) {
            req.flash('error_msg', 'Notification not found.');
            return res.redirect('/student/notifications');
        }

        if (!notification.isRead) {
            notification.isRead = true;
            await notification.save();
        }

        // Render a detail page for notifications that have extra data (attachment or link)
        // The view will show the message, sender, timestamp and any attachment or link.
        return res.render('student/notification-detail', {
            title: 'Notification Detail',
            user: req.session.user,
            notification
        });
    } catch (error) {
        console.error('Error in notificationController.getNotificationDetailPage:', error);
        req.flash('error_msg', 'Could not load the notification detail.');
        return res.redirect('/student/notifications');
    }
};
