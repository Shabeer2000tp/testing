const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['To-Do', 'In Progress', 'Done'],
        default: 'To-Do'
    },
    storyPoints: {
        type: Number,
        required: true,
        min: 0 // Story points cannot be negative
    },
    sprint: {
        type: Schema.Types.ObjectId,
        ref: 'Sprint',
        required: true
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: false // optional when assignedToAll === true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    team: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
     originalSprint: {
        type: Schema.Types.ObjectId,
        ref: 'Sprint'
    },
    isMoved: {
        type: Boolean,
        default: false
    },
    assignedToAll: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;