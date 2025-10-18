const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sprintSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
        // 1. REMOVED unique: true to allow different teams to use the same sprint name
    },
    goal: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['Pending', 'Upcoming', 'Active', 'Completed'],
        default: 'Active'
    },
    // 2. ADD THIS FIELD to link the sprint to a team
    team: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: false // Sprints created by admins won't have a teamId
    }
}, { timestamps: true });

const Sprint = mongoose.model('Sprint', sprintSchema);

module.exports = Sprint;