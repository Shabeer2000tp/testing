const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    // The user who will receive the notification
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'Login', // We link to the Login model as it covers all user roles
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    // An optional link for the user to click
    link: {
        type: String,
        default: '#'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    // Optional path to an attachment
    attachment: {
        path: String,
        originalName: String
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;