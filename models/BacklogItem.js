const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const backlogItemSchema = new Schema({
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    team: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    status: {
        type: String,
        enum: ['New', 'In Sprint'],
        default: 'New'
    }
}, { timestamps: true });

const BacklogItem = mongoose.model('BacklogItem', backlogItemSchema);

module.exports = BacklogItem;