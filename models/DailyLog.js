const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dailyLogSchema = new Schema({
    logContent: {
        type: String,
        required: true,
        trim: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockerDescription: {
        type: String,
        trim: true
    },
     guideFeedback: {
        type: String,
        trim: true
    },
    student: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    team: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    sprint: {
        type: Schema.Types.ObjectId,
        ref: 'Sprint',
        required: true
    }
}, { timestamps: true });

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);

module.exports = DailyLog;