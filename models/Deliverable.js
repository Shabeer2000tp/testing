const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const deliverableSchema = new Schema({
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    team: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    // Optional: Link to a specific task
    task: {
        type: Schema.Types.ObjectId,
        ref: 'Task'
    }
}, { timestamps: true });

const Deliverable = mongoose.model('Deliverable', deliverableSchema);

module.exports = Deliverable;