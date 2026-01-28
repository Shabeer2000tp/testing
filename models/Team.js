const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    students: [{
        type: Schema.Types.ObjectId,
        ref: 'Student', // An array of links to documents in the 'students' collection
        required: true
    }],
    guide: {
        type: Schema.Types.ObjectId,
        ref: 'Guide', // Links to a document in the 'guides' collection
        required: true
    },
     domain: {
        type: String,
        enum: ['Web Development', 'Mobile App', 'AI/ML', 'Data Science', 'IoT', 'Cybersecurity']
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Archived'],
        default: 'Active'
    },
    taskAssignmentPermission: {
        type: String,
        enum: ['guide-only', 'guide-and-designated-student'],
        default: 'guide-only'
    },
    taskMaster: {
        type: Schema.Types.ObjectId,
        ref: 'Student'
    },
     velocityHistory: [{
        sprintName: String,
        completedPoints: Number
    }]
}, { timestamps: true });

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;