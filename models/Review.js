const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const remarkSchema = new Schema({
    reviewer: {
        type: Schema.Types.ObjectId,
        ref: 'Guide',
        required: true
    },
    suggestions: {
        type: String,
        trim: true
    },
    remarks: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const reviewSchema = new Schema({
    reviewDate: {
        type: Date,
        required: true
    },
    team: {
        type: Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    panel: [{
        type: Schema.Types.ObjectId,
        ref: 'Guide'
    }],
    remarks: [remarkSchema], // Embeds a sub-document for each reviewer's feedback
    status: {
        type: String,
        enum: ['Scheduled', 'Completed'],
        default: 'Scheduled'
    }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;