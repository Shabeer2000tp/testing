const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reminderSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    // This field defines who will see the reminder
    targetRole: {
        type: String,
        required: true,
        enum: ['all', 'student', 'guide'], // Can be for everyone, students only, or guides only
        default: 'all'
    }
}, { timestamps: true });

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;