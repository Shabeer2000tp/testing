const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const proposalSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    team: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
     domain: {
        type: Schema.Types.ObjectId,
        ref: 'Domain',
        required: true
    },
   status: {
    type: String,
    enum: ['Pending Guide Approval', 'Pending Admin Confirmation', 'Approved', 'Rejected'],
    default: 'Pending Guide Approval'
},
guideFeedback: {
    type: String
},
adminFeedback: {
    type: String
}
}, { timestamps: true });

const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;